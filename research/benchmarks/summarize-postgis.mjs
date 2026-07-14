import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const resultsDir = resolve(process.env.RESEARCH_OUTPUT_DIR ?? "research/results");
const rows = readFileSync(resolve(resultsDir, "postgis-benchmark.csv"), "utf8")
  .trim()
  .split("\n")
  .slice(1)
  .map((line) => {
    const [polygonCount, run, executionMs, found] = line.split(",");
    return {
      polygonCount: Number(polygonCount),
      run: Number(run),
      executionMs: Number(executionMs),
      found: found === "t"
    };
  });

function percentile(values, quantile) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil(quantile * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

const groups = [...new Set(rows.map((row) => row.polygonCount))].map((polygonCount) => {
  const selected = rows.filter((row) => row.polygonCount === polygonCount);
  const values = selected.map((row) => row.executionMs);
  return {
    polygonCount,
    runs: selected.length,
    meanMs: values.reduce((sum, value) => sum + value, 0) / values.length,
    medianMs: percentile(values, 0.5),
    p95Ms: percentile(values, 0.95),
    p99Ms: percentile(values, 0.99),
    allMatched: selected.every((row) => row.found)
  };
});

const summary = {
  generatedAt: new Date().toISOString(),
  protocol: { warmupRuns: 3, measuredRuns: 10 },
  groups,
  caveat:
    "Local single-client microbenchmark. Results characterize indexed ST_Contains latency, not end-to-end API concurrency."
};
writeFileSync(
  resolve(resultsDir, "postgis-summary.json"),
  `${JSON.stringify(summary, null, 2)}\n`
);
console.log(JSON.stringify(summary, null, 2));
