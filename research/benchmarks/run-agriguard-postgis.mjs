import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const outputDir = resolve("research/results/agriguard-preliminary");
const setupSql = readFileSync(resolve("research/benchmarks/agriguard-postgis.sql"), "utf8");
const measureSql = readFileSync(resolve("research/benchmarks/agriguard-postgis-measure.sql"), "utf8");
mkdirSync(outputDir, { recursive: true });

function psql(input) {
  return execFileSync("docker", [
    "compose", "exec", "-T", "postgis", "psql", "-q", "-U", "bats", "-d", "bats"
  ], { input, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
}

function dockerDatabaseMetadata() {
  const raw = psql("SELECT json_build_object('databaseName', current_database(), 'postgresqlVersion', current_setting('server_version'), 'postgisVersion', PostGIS_Lib_Version())::text;\n");
  const json = raw.split(/\r?\n/).map((line) => line.trim()).find((line) => line.startsWith("{"));
  if (!json) throw new Error("PostGIS metadata query did not return JSON.");
  return JSON.parse(json);
}

function dockerAvailable() {
  try {
    execFileSync("docker", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

async function measureWithPrisma() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Docker is unavailable and DATABASE_URL is not configured for the Prisma fallback.");
  }
  const require = createRequire(resolve("apps/backend/package.json"));
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  try {
    await prisma.$executeRawUnsafe("CREATE EXTENSION IF NOT EXISTS postgis");
    await prisma.$executeRawUnsafe("DROP TABLE IF EXISTS research_agriguard_covers_geometries");
    await prisma.$executeRawUnsafe("CREATE UNLOGGED TABLE research_agriguard_covers_geometries (id bigint PRIMARY KEY, polygon geometry(Polygon, 4326) NOT NULL)");
    await prisma.$executeRawUnsafe(`INSERT INTO research_agriguard_covers_geometries (id, polygon)
      SELECT value, ST_MakeEnvelope(
        107.0 + ((value - 1) % 1000) * 0.001,
        11.0 + floor((value - 1) / 1000) * 0.001,
        107.0 + ((value - 1) % 1000) * 0.001 + 0.0008,
        11.0 + floor((value - 1) / 1000) * 0.001 + 0.0008,
        4326)
      FROM generate_series(1, 100000) AS value`);
    await prisma.$executeRawUnsafe("CREATE INDEX research_agriguard_covers_geometries_gix ON research_agriguard_covers_geometries USING GIST (polygon)");
    await prisma.$executeRawUnsafe("VACUUM (ANALYZE) research_agriguard_covers_geometries");
    const [databaseMetadata] = await prisma.$queryRawUnsafe(`SELECT
      current_database() AS "databaseName",
      current_setting('server_version') AS "postgresqlVersion",
      PostGIS_Lib_Version() AS "postgisVersion"`);
    const lines = ["polygon_count,run,execution_ms,found"];
    for (const polygonCount of [100, 1000, 10000, 100000]) {
      const longitude = polygonCount === 100 ? 107.0504 : 107.5004;
      const latitude = polygonCount === 100 ? 11.0004 : polygonCount === 1000
        ? 11.0004 : polygonCount === 10000 ? 11.0054 : 11.0504;
      for (let iteration = 1; iteration <= 13; iteration += 1) {
        const plans = await prisma.$queryRawUnsafe(`EXPLAIN (ANALYZE, FORMAT JSON)
          SELECT id FROM research_agriguard_covers_geometries
          WHERE id <= ${polygonCount}
            AND ST_Covers(polygon, ST_SetSRID(ST_Point(${longitude}, ${latitude}), 4326))
          LIMIT 1`);
        const cell = plans[0]?.["QUERY PLAN"];
        const parsed = typeof cell === "string" ? JSON.parse(cell) : cell;
        const document = Array.isArray(parsed) ? parsed[0] : parsed;
        if (iteration > 3) {
          lines.push(`${polygonCount},${iteration - 3},${Number(document?.["Execution Time"])},${Number(document?.Plan?.["Actual Rows"]) > 0 ? "t" : "f"}`);
        }
      }
    }
    return { csv: `${lines.join("\n")}\n`, source: "PostgreSQL EXPLAIN ANALYZE via Prisma", databaseMetadata };
  } finally {
    await prisma.$disconnect();
  }
}

let measurement;
if (dockerAvailable()) {
  psql(setupSql);
  const raw = psql(measureSql);
  const headerIndex = raw.indexOf("polygon_count,run,execution_ms,found");
  if (headerIndex < 0) throw new Error("PostGIS measurement output did not contain the CSV header.");
  measurement = {
    csv: raw.slice(headerIndex).trim() + "\n",
    source: "server-side clock_timestamp via Docker psql",
    databaseMetadata: dockerDatabaseMetadata()
  };
} else {
  measurement = await measureWithPrisma();
}
const { csv } = measurement;
writeFileSync(resolve(outputDir, "agriguard-postgis-benchmark.csv"), csv);

const rows = csv.trim().split(/\r?\n/).slice(1).map((line) => {
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
  const index = Math.max(0, Math.min(sorted.length - 1, Math.ceil(quantile * sorted.length) - 1));
  return sorted[index] ?? 0;
}

const groups = [...new Set(rows.map((row) => row.polygonCount))].map((polygonCount) => {
  const selected = rows.filter((row) => row.polygonCount === polygonCount);
  const values = selected.map((row) => row.executionMs);
  return {
    polygonCount,
    measuredRuns: selected.length,
    medianMs: percentile(values, 0.5),
    p95Ms: percentile(values, 0.95),
    p99Ms: percentile(values, 0.99),
    allMatched: selected.every((row) => row.found)
  };
});

const summary = {
  generatedAt: new Date().toISOString(),
  benchmark: "single-client indexed ST_Covers lookup benchmark",
  protocol: { polygonCounts: [100, 1000, 10000, 100000], warmupRuns: 3, measuredRuns: 10 },
  measurementSource: measurement.source,
  databaseMetadata: measurement.databaseMetadata,
  groups,
  caveat: "Single-client indexed ST_Covers lookup benchmark; not API or end-to-end latency."
};
writeFileSync(resolve(outputDir, "agriguard-postgis-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
const section = `<!-- AGRIGUARD_POSTGIS_START -->
PostGIS label: **single-client indexed ST_Covers lookup benchmark**. This is not API or end-to-end latency.

| Polygons | Median (ms) | p95 (ms) | p99 (ms) | All matched |
|---:|---:|---:|---:|:---:|
${groups.map((group) => `| ${group.polygonCount.toLocaleString("en-US")} | ${group.medianMs.toFixed(3)} | ${group.p95Ms.toFixed(3)} | ${group.p99Ms.toFixed(3)} | ${group.allMatched ? "yes" : "no"} |`).join("\n")}

Measurement source: ${measurement.source}. Database metadata: \`${JSON.stringify(measurement.databaseMetadata)}\`.
<!-- AGRIGUARD_POSTGIS_END -->`;
for (const filename of ["PRELIMINARY_RESULTS.md", "PRELIMINARY_RESEARCH_SUMMARY.md"]) {
  const preliminaryPath = resolve(outputDir, filename);
  try {
    const current = readFileSync(preliminaryPath, "utf8").replace(
      /<!-- AGRIGUARD_POSTGIS_START -->[\s\S]*?<!-- AGRIGUARD_POSTGIS_END -->/,
      section
    );
    writeFileSync(preliminaryPath, current);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}
const environmentPath = resolve(outputDir, "environment.json");
try {
  const environment = JSON.parse(readFileSync(environmentPath, "utf8"));
  environment.database = measurement.databaseMetadata;
  writeFileSync(environmentPath, `${JSON.stringify(environment, null, 2)}\n`);
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}
console.log(JSON.stringify(summary, null, 2));
