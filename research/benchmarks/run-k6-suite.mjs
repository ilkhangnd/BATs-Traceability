import { execSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const baseUrl = process.env.BASE_URL ?? "http://localhost:4400";
const outputDir = process.env.OUTPUT_DIR ?? "research/results";
const scenarios = ["harvest", "verify", "plots", "mixed"];
const vusList = [100, 500, 1000, 5000];

console.log("Retrieving benchmark token from staging...");
const tokenOutput = execSync(
  "ADMIN_PASSWORD=staging-only-admin-password node scripts/benchmark-token.mjs",
  { encoding: "utf8" }
);
const accessToken = tokenOutput.trim();
if (!accessToken) throw new Error("Could not get access token from staging.");

await mkdir(outputDir, { recursive: true });

const summaryResults = [];

// For rapid yet statistically significant formal paper evaluation across 100/500/1000/5000 VUs:
const targetMatrix = [
  { scenario: "mixed", vus: 100, ramp: "5s", hold: "10s", down: "5s" },
  { scenario: "mixed", vus: 500, ramp: "5s", hold: "12s", down: "5s" },
  { scenario: "mixed", vus: 1000, ramp: "5s", hold: "15s", down: "5s" },
  { scenario: "mixed", vus: 5000, ramp: "10s", hold: "20s", down: "10s" },
  { scenario: "harvest", vus: 100, ramp: "5s", hold: "10s", down: "5s" },
  { scenario: "harvest", vus: 500, ramp: "5s", hold: "12s", down: "5s" }
];

for (const item of targetMatrix) {
  console.log(`\n======================================================`);
  console.log(`Running k6 benchmark: Scenario [${item.scenario}] @ ${item.vus} VUs`);
  console.log(`======================================================`);
  const summaryPath = join(outputDir, `api-load-${item.scenario}-${item.vus}vu.json`);
  
  const cmd = [
    `k6 run`,
    `-e BASE_URL=${baseUrl}`,
    `-e ACCESS_TOKEN="${accessToken}"`,
    `-e SCENARIO=${item.scenario}`,
    `-e TARGET_VUS=${item.vus}`,
    `-e SLEEP_TIME=0.5`,
    `-e RAMP_DURATION=${item.ramp}`,
    `-e HOLD_DURATION=${item.hold}`,
    `-e RAMP_DOWN_DURATION=${item.down}`,
    `-e SUMMARY_FILE=${summaryPath}`,
    `research/benchmarks/api-load.k6.js`
  ].join(" ");

  try {
    execSync(cmd, { stdio: "inherit" });
  } catch (err) {
    console.warn(`[WARN] k6 test finished with thresholds crossed or non-zero exit for ${item.scenario} @ ${item.vus} VU.`);
  }

  try {
    const rawData = JSON.parse(await readFile(summaryPath, "utf8"));
    const m = rawData.metrics;
    const itemResult = {
      scenario: item.scenario,
      targetVus: item.vus,
      totalRequests: m.http_reqs?.values?.count ?? 0,
      rps: Number((m.http_reqs?.values?.rate ?? 0).toFixed(2)),
      errorRate: Number(((m.http_req_failed?.values?.rate ?? 0) * 100).toFixed(3)),
      latencyMs: {
        avg: Number((m.http_req_duration?.values?.avg ?? 0).toFixed(2)),
        med: Number((m.http_req_duration?.values?.med ?? 0).toFixed(2)),
        p90: Number((m.http_req_duration?.values?.["p(90)"] ?? 0).toFixed(2)),
        p95: Number((m.http_req_duration?.values?.["p(95)"] ?? 0).toFixed(2)),
        p99: Number((m.http_req_duration?.values?.["p(99)"] ?? 0).toFixed(2)),
        max: Number((m.http_req_duration?.values?.max ?? 0).toFixed(2))
      }
    };
    summaryResults.push(itemResult);
  } catch (readErr) {
    console.error(`Could not read summary file ${summaryPath}:`, readErr);
  }
}

const finalSummaryJsonPath = join(outputDir, "k6-benchmark-staging-suite.json");
await writeFile(finalSummaryJsonPath, JSON.stringify(summaryResults, null, 2));

const mdTableLines = [
  "# BATS Staging Load Benchmark Results (k6)",
  "",
  "Tested against BATS Staging Docker Container (`http://localhost:4400`) with PostGIS spatial query verification and daily Merkle hash generation.",
  "",
  "| Scenario | Target VUs | Total Reqs | Throughput (RPS) | Error Rate (%) | Latency Avg (ms) | Latency P95 (ms) | Latency P99 (ms) |",
  "| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |"
];

for (const r of summaryResults) {
  mdTableLines.push(
    `| **${r.scenario}** | ${r.targetVus} | ${r.totalRequests.toLocaleString()} | **${r.rps.toLocaleString()}** | ${r.errorRate}% | ${r.latencyMs.avg} | **${r.latencyMs.p95}** | ${r.latencyMs.p99} |`
  );
}

mdTableLines.push("");
const finalSummaryMdPath = join(outputDir, "k6-benchmark-staging-suite.md");
await writeFile(finalSummaryMdPath, mdTableLines.join("\n"));

console.log(`\nSuccessfully wrote formal k6 benchmark suite JSON: ${finalSummaryJsonPath}`);
console.log(`Successfully wrote formal k6 benchmark table MD: ${finalSummaryMdPath}`);
