import { mkdir, writeFile } from "node:fs/promises";
import { cpus, hostname, platform, release } from "node:os";
import { join } from "node:path";
import { performance } from "node:perf_hooks";

const baseUrl = process.env.BASE_URL ?? "http://localhost:4400";
const accessToken = process.env.ACCESS_TOKEN;
const vus = positiveInt(process.env.VUS, 5);
const durationSeconds = positiveInt(process.env.DURATION_SECONDS, 10);
const outputDir = process.env.OUTPUT_DIR ?? "research/results";
const label = process.env.LABEL ?? "node-smoke";

if (!accessToken) {
  throw new Error("Thiếu ACCESS_TOKEN. Chạy `pnpm staging:token` để lấy token staging.");
}

function positiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return Number(sorted[index].toFixed(3));
}

async function oneHarvest(workerId, iteration) {
  const unique = `${label}-${workerId}-${iteration}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
  const started = performance.now();
  try {
    const response = await fetch(`${baseUrl}/batches/harvest`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${accessToken}`,
        "x-idempotency-key": unique
      },
      body: JSON.stringify({
        farmPlotId: "plot-dlk-0001",
        actorId: "FARMER-0001",
        variety: "Ri6",
        quantityKg: 1,
        eventTime: new Date().toISOString(),
        location: { latitude: 12.6789, longitude: 108.1234 },
        evidenceHashes: [`node-load-${unique}`]
      })
    });
    const latencyMs = performance.now() - started;
    await response.arrayBuffer();
    return { ok: response.status === 201, status: response.status, latencyMs };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      latencyMs: performance.now() - started,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function worker(workerId, deadline) {
  const results = [];
  let iteration = 0;
  while (performance.now() < deadline) {
    results.push(await oneHarvest(workerId, iteration));
    iteration += 1;
  }
  return results;
}

const startedAt = new Date().toISOString();
const started = performance.now();
const deadline = started + durationSeconds * 1000;
const results = (
  await Promise.all(Array.from({ length: vus }, (_, index) => worker(index + 1, deadline)))
).flat();
const wallTimeMs = performance.now() - started;
const latencies = results.map((result) => result.latencyMs);
const failures = results.filter((result) => !result.ok);
const statusCounts = results.reduce((acc, result) => {
  acc[result.status] = (acc[result.status] ?? 0) + 1;
  return acc;
}, {});

const summary = {
  benchmark: "api-load-node",
  label,
  baseUrl,
  startedAt,
  durationSeconds,
  vus,
  totalRequests: results.length,
  successfulRequests: results.length - failures.length,
  failedRequests: failures.length,
  errorRate: results.length > 0 ? Number((failures.length / results.length).toFixed(4)) : 0,
  rps: Number((results.length / (wallTimeMs / 1000)).toFixed(3)),
  latencyMs: {
    min: Number(Math.min(...latencies).toFixed(3)),
    avg: Number((latencies.reduce((sum, value) => sum + value, 0) / latencies.length).toFixed(3)),
    p50: percentile(latencies, 50),
    p95: percentile(latencies, 95),
    p99: percentile(latencies, 99),
    max: Number(Math.max(...latencies).toFixed(3))
  },
  statusCounts,
  sampleErrors: failures.slice(0, 5),
  environment: {
    node: process.version,
    platform: `${platform()} ${release()}`,
    hostname: hostname(),
    cpus: cpus().length
  }
};

await mkdir(outputDir, { recursive: true });
const timestamp = startedAt.replaceAll(/[:.]/g, "-");
const jsonPath = join(outputDir, `api-load-node-${timestamp}.json`);
const csvPath = join(outputDir, `api-load-node-${timestamp}.csv`);
await writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`);
await writeFile(
  csvPath,
  [
    "status,ok,latency_ms,error",
    ...results.map((result) =>
      [
        result.status,
        result.ok,
        result.latencyMs.toFixed(3),
        JSON.stringify(result.error ?? "")
      ].join(",")
    )
  ].join("\n")
);

console.log(JSON.stringify(summary, null, 2));
console.log(`Wrote ${jsonPath}`);
console.log(`Wrote ${csvPath}`);
