import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const resultsDir = resolve(process.env.RESEARCH_OUTPUT_DIR ?? "research/results");
const data = JSON.parse(readFileSync(resolve(resultsDir, "merkle-benchmark.json"), "utf8"));

function percentile(values, quantile) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(quantile * sorted.length) - 1)];
}

const groups = [...new Set(data.results.map((row) => row.size))].map((size) => {
  const rows = data.results.filter((row) => row.size === size);
  const metric = (name) => {
    const values = rows.map((row) => row[name]);
    return {
      median: percentile(values, 0.5),
      p95: percentile(values, 0.95),
      p99: percentile(values, 0.99)
    };
  };
  return {
    size,
    runs: rows.length,
    rootMs: metric("rootMs"),
    proofMs: metric("proofMs"),
    verifyMs: metric("verifyMs"),
    proofBytes: rows[0]?.proofBytes,
    allVerified: rows.every((row) => row.verified)
  };
});

const summary = {
  generatedAt: new Date().toISOString(),
  node: data.node,
  platform: data.platform,
  groups
};
writeFileSync(
  resolve(resultsDir, "merkle-summary.json"),
  `${JSON.stringify(summary, null, 2)}\n`
);
console.log(JSON.stringify(summary, null, 2));
