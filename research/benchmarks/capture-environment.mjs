import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import { resolve } from "node:path";

const outputDir = resolve(process.env.RESEARCH_OUTPUT_DIR ?? "research/results");
mkdirSync(outputDir, { recursive: true });

function git(args) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return "unavailable";
  }
}

const checksums = {};
if (existsSync(outputDir)) {
  for (const filename of readdirSync(outputDir)) {
    const path = resolve(outputDir, filename);
    if (!filename.endsWith(".csv") && !filename.endsWith(".json") && !filename.endsWith(".txt")) {
      continue;
    }
    if (filename === "environment.json") continue;
    checksums[filename] = createHash("sha256").update(readFileSync(path)).digest("hex");
  }
}

const metadata = {
  capturedAt: new Date().toISOString(),
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  git: {
    commit: git(["rev-parse", "HEAD"]),
    status: git(["status", "--short"])
  },
  runtime: {
    node: process.version,
    v8: process.versions.v8,
    platform: process.platform,
    architecture: process.arch
  },
  machine: {
    hostname: os.hostname(),
    os: `${os.type()} ${os.release()}`,
    cpuModel: os.cpus()[0]?.model,
    logicalCores: os.cpus().length,
    totalMemoryBytes: os.totalmem()
  },
  experimentParameters: {
    merkleSizes: process.env.MERKLE_SIZES ?? "1000,10000,100000,1000000",
    merkleRepeats: process.env.MERKLE_REPEATS ?? "3",
    businessTimezone: process.env.BUSINESS_TIMEZONE ?? "Asia/Ho_Chi_Minh"
  },
  resultChecksums: checksums
};

writeFileSync(resolve(outputDir, "environment.json"), `${JSON.stringify(metadata, null, 2)}\n`);
console.log(`Captured research environment metadata in ${outputDir}/environment.json`);
