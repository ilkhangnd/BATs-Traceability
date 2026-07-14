import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { resolve } from "node:path";

const hashPair = (left, right) =>
  createHash("sha256")
    .update(Buffer.concat([Buffer.from(left, "hex"), Buffer.from(right, "hex")]))
    .digest("hex");

function root(leaves) {
  if (leaves.length === 0) return "0".repeat(64);
  let level = leaves;
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      next.push(hashPair(left, level[i + 1] ?? left));
    }
    level = next;
  }
  return level[0];
}

function proof(leaves, index) {
  const siblings = [];
  let cursor = index;
  let level = leaves;
  while (level.length > 1) {
    const siblingIndex = cursor % 2 === 0 ? cursor + 1 : cursor - 1;
    siblings.push(level[siblingIndex] ?? level[cursor]);
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      next.push(hashPair(left, level[i + 1] ?? left));
    }
    cursor = Math.floor(cursor / 2);
    level = next;
  }
  return siblings;
}

function verify(leaf, siblings, index, expectedRoot) {
  let value = leaf;
  let cursor = index;
  for (const sibling of siblings) {
    value = cursor % 2 === 0 ? hashPair(value, sibling) : hashPair(sibling, value);
    cursor = Math.floor(cursor / 2);
  }
  return value === expectedRoot;
}

const sizes = (process.env.MERKLE_SIZES ?? "1000,10000,100000,1000000")
  .split(",")
  .map(Number)
  .filter((value) => Number.isInteger(value) && value > 0);
const repeats = Math.max(1, Number(process.env.MERKLE_REPEATS ?? "3"));
const outputDir = resolve(process.env.RESEARCH_OUTPUT_DIR ?? "research/results");
const results = [];

for (const size of sizes) {
  const leaves = Array.from({ length: size }, (_, index) =>
    createHash("sha256").update(`bats-event-${index}`).digest("hex")
  );
  for (let run = 1; run <= repeats; run += 1) {
    const startRoot = performance.now();
    const merkleRoot = root(leaves);
    const rootMs = performance.now() - startRoot;
    const index = Math.floor(size / 2);
    const startProof = performance.now();
    const siblings = proof(leaves, index);
    const proofMs = performance.now() - startProof;
    const startVerify = performance.now();
    const verified = verify(leaves[index], siblings, index, merkleRoot);
    const verifyMs = performance.now() - startVerify;
    results.push({
      size,
      run,
      rootMs,
      proofMs,
      verifyMs,
      proofHashes: siblings.length,
      proofBytes: siblings.length * 32,
      verified
    });
    console.log(
      `N=${size} run=${run}: root=${rootMs.toFixed(2)}ms proof=${proofMs.toFixed(
        2
      )}ms verify=${verifyMs.toFixed(3)}ms`
    );
  }
}

mkdirSync(outputDir, { recursive: true });
const columns = [
  "size",
  "run",
  "root_ms",
  "proof_ms",
  "verify_ms",
  "proof_hashes",
  "proof_bytes",
  "verified"
];
const csv = [
  columns.join(","),
  ...results.map((row) =>
    [
      row.size,
      row.run,
      row.rootMs,
      row.proofMs,
      row.verifyMs,
      row.proofHashes,
      row.proofBytes,
      row.verified
    ].join(",")
  )
].join("\n");
writeFileSync(resolve(outputDir, "merkle-benchmark.csv"), `${csv}\n`);
writeFileSync(
  resolve(outputDir, "merkle-benchmark.json"),
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      node: process.version,
      platform: `${process.platform}-${process.arch}`,
      repeats,
      results
    },
    null,
    2
  )}\n`
);
