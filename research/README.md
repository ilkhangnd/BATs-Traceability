# BATS reproducible research suite

This directory turns the MVP into a measurable research artifact. Generated
files go to `research/results/` and must be archived together with the commit
hash, machine specification and raw command output used in the paper.

## 1. Merkle scalability

```bash
pnpm research:merkle
```

Defaults to \(N=10^3,10^4,10^5,10^6\), three repetitions each. Override with:

```bash
MERKLE_SIZES=1000,10000 MERKLE_REPEATS=10 pnpm research:merkle
```

Outputs construction, proof generation and verification time plus proof size.

## 2. Synthetic fraud evaluation

```bash
pnpm research:fraud
```

Creates 2,150 seeded deterministic samples, including 1,430 operationally valid
cases and 720 injected fraud cases. All G/Y/D/T/R/W/A rules are evaluated.
Noise cases deliberately include in-geofence GPS spoofing (false negatives) and
legitimate degraded GPS (false positives). Do not describe these metrics as
field accuracy; independently labelled pilot data is still required.

## 3. EVM gas benchmark

```bash
pnpm research:gas
```

Measures median gas on the local Hardhat EVM for a BATS daily root, a direct
event storage baseline and a minimal batch-token baseline, then projects daily
cost for several event volumes. The token baseline is intentionally minimal,
not a standards-complete ERC-721. A paper comparing ERC-721 must add and cite a
specific production implementation rather than relabel this baseline.

## 4. API load

Install k6 separately, run the backend, and point the test at the PostgreSQL
staging API. Keep each experiment isolated because this endpoint creates real
batch rows:

```bash
k6 run -e ACCESS_TOKEN="$BATS_BENCHMARK_TOKEN" -e TARGET_VUS=100 -e HOLD_DURATION=2m research/benchmarks/api-load.k6.js
k6 run -e ACCESS_TOKEN="$BATS_BENCHMARK_TOKEN" -e TARGET_VUS=500 -e HOLD_DURATION=2m research/benchmarks/api-load.k6.js
```

Repeat for 1,000 and 5,000 virtual users only on a dedicated staging database.
If k6 is not installed, use the Node runner as a smoke/concurrency check, not as
the final paper benchmark:

```bash
ACCESS_TOKEN="$(ADMIN_PASSWORD=staging-only-admin-password BASE_URL=http://localhost:4400 pnpm -s staging:token)" \
BASE_URL=http://localhost:4400 \
VUS=10 \
DURATION_SECONDS=15 \
pnpm research:api:node
```

The Node runner writes JSON and CSV to `research/results/`. Use it to catch API,
auth, idempotency and database issues before the formal k6 campaign.

Current status: a k6 staging suite has been run and stored in
`research/results/k6-benchmark-staging-suite.*`, but it currently shows high
latency and high error rates. Treat it as diagnostic evidence, not as a
successful scalability result.

## 5. PostGIS geofence

With the Docker PostGIS service running:

```bash
docker compose up -d postgis
docker compose exec -T postgis psql -U bats -d bats -f - < research/benchmarks/postgis.sql
docker compose exec -T postgis psql -q -U bats -d bats -f - < research/benchmarks/postgis-measure.sql > research/results/postgis-benchmark.csv
pnpm research:postgis:summary
pnpm research:metadata
```

The script generates 100,000 polygons, builds a GiST index, and reports
`EXPLAIN ANALYZE` execution time and buffers for \(10^2\) through \(10^5\)
candidate rows. The measurement script performs 3 warm-ups and 10 recorded
runs per scale.

## Reporting protocol

Use at least 10 measured repetitions after warm-up for paper tables. Report
median, p95 and p99 where applicable, software/hardware versions, seed or data
generator version, and confidence intervals. Never copy the expected “99.9%”
gas saving into the paper before the raw benchmark confirms it.

Generate editable SVG figures after the raw benchmarks:

```bash
pnpm research:charts
```

Figures are written to `research/results/figures/`.
