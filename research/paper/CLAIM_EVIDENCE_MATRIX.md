# Claim–evidence matrix

Status: updated 2026-07-15. This matrix defines which manuscript claims are
currently defensible and which claims must remain future work.

## Claim status scale

- **A — ready for Results/Abstract:** measured, reproducible artifact exists,
  caveat is clear.
- **B — ready for Methods/Discussion:** implemented or analytically justified,
  but not enough for a strong quantitative claim.
- **C — diagnostic/partial:** evidence exists but currently shows limitations
  or failures.
- **D — blocked:** no data yet; must not be claimed as a result.

| Claim | Evidence | Status | Can appear in Abstract? | Required wording |
| --- | --- | --- | --- | --- |
| BATS separates operational event storage from immutable daily commitments | Architecture, backend implementation, Solidity contract | A | Yes | "data-first, anchor-first architecture" |
| Daily on-chain storage is constant-size in the number of daily events | Formal model + one-root-per-day contract | A | Yes | "constant-size daily blockchain commitment" |
| Merkle construction scales to 1,000,000 daily events locally | `merkle-summary.json`, 10 runs | A | Yes | "local benchmark" |
| Client proof verification is lightweight | Merkle verify median 0.0156 ms at 1,000,000 events | A | Yes | Include runtime/environment caveat |
| PostGIS geofence lookup is feasible at province-scale synthetic polygon counts | `postgis-summary.json`, 100,000 polygons | A | Yes | "single-client indexed spatial microbenchmark" |
| Rule engine detects injected noisy fraud cases | `fraud-metrics.json`, 2,150 samples | A | Yes | "seeded synthetic dataset" |
| BATS saves gas relative to direct/minimal-token and full ERC-721 local EVM baselines | `gas-benchmark.json`, 30 samples (`FullERC721TraceabilityBaseline.sol` vs BATS `anchorDailyRoot`) | A | Yes | Say "local EVM baselines" (BATS 94,755 daily vs ERC-721 126,554/event) |
| BATS public mainnet transaction cost savings | No public network cost regime conversion | D | No | Future work |
| BATS is EPCIS 2.0 certified/compliant | EPCIS-aligned JSON-LD, no conformance test | B | No | Say "EPCIS 2.0-aligned" |
| BATS supports GS1 Digital Link style verification URLs | Backend route and GS1 Digital Link standard | B | Maybe | Say "GS1 Digital Link-style/compatible URI pattern" unless conformance tested |
| BATS handles high API concurrency at 100–5,000 VUs | k6 results show high error/timeout | C | No | "The current k6 campaign revealed timeout-driven bottlenecks under high concurrency; treated as an engineering limitation rather than a positive claim." |
| BATS rule engine ablation proves multi-layered validation contribution (`Geofence` $\rightarrow$ `+Yield` $\rightarrow$ `+Duplicate` $\rightarrow$ `Full 7-Rule`) | `fraud-ablation.json`, F1 progression up to 0.9333 | A | Yes | "multi-layered rule engine evaluation on synthetic dataset" |
| BATS offline-first idempotency replay prevents duplicate batch creation exactly-once | `idempotency-simulation.json`, simulated replay | A | Yes | "simulated network replay and idempotency verification" |
| Zalo Mini App provides deployment readiness and offline-first architectural feasibility | Technical scaffold & offline queue verification | A | Yes | Say "deployment demonstration & architectural feasibility", not empirical user study |
| BATS is usable by smallholder farmers in under 60 seconds | No empirical field study | D | No | Future work / hypothesis |
| SUS score exceeds 70 | No empirical SUS data | D | No | Future work |
| BATS improves real-world fraud detection | No independent field labels | D | No | Future work |

## Abstract-safe quantitative claims

The following numbers are safe to use in the abstract if the caveats are kept:

1. Merkle root generation for one million leaves: median 580.173 ms.
2. Merkle proof verification for one million leaves: median 0.0156 ms,
   proof size 640 B.
3. Indexed PostGIS lookup at 100,000 synthetic polygons: median 0.050 ms,
   p95 0.056 ms.
4. Synthetic fraud evaluation: precision 0.8974, recall 0.9722, F1 0.9333 across 7 validation rules.
5. Daily anchor local EVM gas: median 94,755 gas for one daily root versus 126,554 gas per event for a full OpenZeppelin ERC-721 traceability baseline and 48,559 gas per event for minimal token baseline.
6. Idempotence under simulated network replay: 100% duplicate prevention across repeated submissions and offline queue replays (`idempotency-simulation.json`).

## Claims to keep out of Abstract

1. k6 scalability at 100–5,000 VUs (treated strictly as an engineering limitation).
2. Public mainnet fiat cost/gas regime conversion across multiple chains.
3. Empirical field usability, SUS/TAM scores, or human task completion time.
4. EPCIS conformance certification.
5. Production-grade Zalo Mini App adoption.

