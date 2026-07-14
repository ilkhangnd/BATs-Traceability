# Data and Code Availability Statement

**Title:** BATS: Hệ thống truy xuất nguồn gốc nông sản dựa trên chuẩn GS1 EPCIS, kiểm định dữ liệu và neo bằng chứng blockchain (*BATS: An Agricultural Traceability System Based on GS1 EPCIS Standards, Data Validation, and Blockchain Evidence Anchoring*)
**Updated:** 2026-07-14
**Repository Status:** Complete Open-Source Monorepo & Evaluation Harness

---

## 1. Code Availability

The complete source code for BATS—including the NestJS backend API, Next.js web portal, Zalo Mini App client scaffold (`FARMER` / `COLLECTOR` workflows), Hardhat/Anvil smart contract suites, and PostGIS spatial migration files—is preserved in the self-contained TypeScript monorepo under MIT / Academic research license.

### Core Repository Structure:
- `apps/backend/` (`@bats/backend`): NestJS backend implementing GS1 EPCIS 2.0 object endpoints (`/batches/harvest`, `/batches/transfer`), the 7-rule input validation engine (`rule-engine.service.ts`), daily Merkle tree construction (`merkle.service.ts`), and PostGIS geofence queries (`plots.service.ts`).
- `apps/web/` (`@bats/web`): Next.js web portal with full Vietnamese localization (100% Montserrat font), public Digital Link verification (`/verify/[gtin]/[lot]/[serial]`), and role-separated admin dashboard.
- `apps/zalo-mini-app/` (`@bats/zalo-mini-app`): Mobile client interface with offline-first local queues, role-phone identity isolation (`role + phone`), SHA-256 local evidence hashing, and persistent bottom taskboard.
- `apps/blockchain/` (`@bats/blockchain`): Hardhat/Anvil smart contract suite (`BATSDailyAnchor.sol`) for daily root commitments (`commitDailyRoot`) and gas benchmarking (`gas-benchmark.ts`).

---

## 2. Data Availability & Benchmark Artifacts

To guarantee 100% computational reproducibility without requiring external proprietary API keys or inventing unverified field data, all quantitative evaluation datasets, synthetic fraud test benches, and benchmark scripts are archived directly in `research/results/`.

### Summary of Archived Evaluation Datasets:
1. **Merkle Scalability Benchmark (`merkle-benchmark.csv`)**: Raw latency measurements (median, p95) across 10 repeated runs for daily event volumes \(N \in \{10^3, 10^4, 10^5, 10^6\}\).
2. **PostGIS Spatial Geofence Benchmark (`postgis-benchmark.csv`)**: Raw query latency and intersection match verification across \(M \in \{10^2, 10^3, 10^4, 10^5\}\) candidate polygons using GiST R-tree indexing.
3. **Synthetic Fraud Evaluation Dataset (`fraud-dataset.csv`)**: 2,150 labeled synthetic agricultural event submissions (1,430 operationally valid cases and 720 injected boundary anomaly/fraud cases) establishing precision 0.9589, recall 0.9722, and F1 0.9655.
4. **Local EVM Gas Comparison (`gas-benchmark.csv`)**: 30 Hardhat/Anvil local transaction gas measurements comparing BATS daily Merkle root commitments against direct per-event baseline logging and minimal batch-token baselines.

---

## 3. Cryptographic Verification Manifest (SHA-256 Checksums)

All primary quantitative evaluation artifacts stored in `research/results/` are verified against the following exact SHA-256 cryptographic hashes:

| Artifact Path | SHA-256 Hash | Description |
| --- | --- | --- |
| `research/results/merkle-benchmark.csv` | `e35a755ba17b2e61abc5be42f9ef61996e6e99a924c54fc3caafe6c026a841b7` | Raw Merkle construction & verification latency runs |
| `research/results/merkle-benchmark.json` | `bd718e7423e2596496e7bd73733720e70929d3b53b222567da5af641e20db9bc` | Structured Merkle benchmark summary |
| `research/results/postgis-benchmark.csv` | `ab8a004ed1dcbc48e184e82a599c21dc39d7ce4d559b48c86158f773a17690ff` | Raw PostGIS R-tree spatial lookup latencies |
| `research/results/postgis-benchmark.txt` | `a043e61c9842e9ca4e89e6ce1ef5e56d873eaca22ab1c6cab1a413d9d5dcb4f1` | PostGIS SQL `EXPLAIN ANALYZE` execution logs |
| `research/results/fraud-dataset.csv` | `7d4d2355218c519933956fca2463fa5e7cadb45df070d41e896ef8d879cffe57` | 2,150 labeled synthetic fraud evaluation samples |
| `research/results/fraud-metrics.json` | `d6db62c573a8753869102b11946430e7a5ba8867297ca78ee4acd8ba55644754` | Precision, recall, F1, and confusion matrix JSON |
| `research/results/gas-benchmark.csv` | `acb47a0342923be4a4df935133470d38ecf323e154fda6c24e8732ab47c0e908` | Local Hardhat EVM transaction gas measurements |
| `research/results/gas-benchmark.json` | `5ed5ac427c0b499024544acf99c548d69564537e1def3ebd88c23da9bfd9a13c` | EVM gas summary & asymptotic projection calculations |
| `research/results/environment.json` | `3d3b5eee1096b16422da2c5715c6b3a2c20794d7fc64dec4e806c204c1d6bc30` | Hardware, OS, Node.js, and Docker configuration state |

---

## 4. Instructions for Reviewers & Auditors

To independently reproduce all benchmark numbers and verify data integrity:
1. Verify dataset integrity using standard utilities directly from the repository root:
   ```bash
   shasum -a 256 -c research/results/checksums.sha256
   ```
2. Re-run local Merkle microbenchmarks directly from the research suite:
   ```bash
   node research/benchmarks/merkle.mjs
   ```
3. Re-run Hardhat EVM Gas microbenchmarks:
   ```bash
   pnpm --filter @bats/blockchain run research:gas
   ```
4. Re-run backend unit and integration tests (including rule validation):
   ```bash
   pnpm --filter @bats/backend run test
   ```
