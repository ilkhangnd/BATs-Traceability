# Results and figure plan

Status: paper-ready quantitative table draft, updated 2026-07-11.

This file consolidates measured results that may be cited in the Results
section. Numbers must not be copied into the Abstract unless the corresponding
raw file, script and caveat are preserved in the artifact package.

## RQ1 — Architecture, scalability and anchoring

### Merkle scalability

Raw files:

- `research/results/merkle-benchmark.csv`
- `research/results/merkle-benchmark.json`
- `research/results/merkle-summary.json`
- `research/results/figures/merkle-runtime.svg`

Ten measured runs were executed for each event count.

| Daily events | Root median (ms) | Root p95 (ms) | Verify median (ms) | Proof size |
| ---: | ---: | ---: | ---: | ---: |
| 1,000 | 0.679 | 1.757 | 0.0067 | 320 B |
| 10,000 | 5.561 | 8.636 | 0.0110 | 448 B |
| 100,000 | 55.379 | 67.158 | 0.0128 | 544 B |
| 1,000,000 | 580.173 | 627.967 | 0.0156 | 640 B |

Interpretation: Merkle construction scales approximately linearly with the
number of daily events, while client-side proof verification remains
sub-millisecond in this local Node.js benchmark. The storage committed on-chain
is constant-size per day because only one root is sent to the smart contract.

Recommended figure: `figures/merkle-runtime.svg`, with a caption that separates
root construction, proof generation and proof verification.

### Gas benchmark

Raw files:

- `research/results/gas-benchmark.csv`
- `research/results/gas-benchmark.json`
- `research/results/figures/gas-comparison.svg`

Local Hardhat EVM median transaction gas from 30 samples:

| Method | Median gas per transaction | Scope |
| --- | ---: | --- |
| BATS daily Merkle root | 94,666 | One root per day |
| Direct event baseline | 44,168 | One event per transaction |
| Minimal batch-token baseline | 48,564 | One minimal token transaction per event |

Projected gas at 1,000 events:

| Method | Projected gas | Saving of BATS vs baseline |
| --- | ---: | ---: |
| Minimal batch-token baseline | 48,564,000 | 99.805% |
| Direct event log baseline | 44,168,000 | 99.786% |
| BATS daily Merkle anchor | 94,666 | Reference |

Interpretation: the result supports the asymptotic claim that anchor-first
commitment avoids per-event on-chain cost. It does **not** yet support a claim
against a production ERC-721 implementation or a public network cost model.

Recommended figure: `figures/gas-comparison.svg`, titled as "local EVM
baselines" rather than "mainnet cost".

### API load

Raw files:

- `research/results/api-load-node-2026-07-09T08-42-31-418Z.json`
- `research/results/api-load-node-2026-07-09T08-42-31-418Z.csv`
- `research/results/k6-benchmark-staging-suite.json`
- `research/results/k6-benchmark-staging-suite.md`

Node smoke test:

| VUs | Duration | Requests | Success | Error rate | RPS | p95 latency |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 3 | 5 s | 1,094 | 1,094 | 0% | 218.258 | 30.562 ms |

k6 staging suite:

| Scenario | Target VUs | Requests | RPS | Error rate | p95 latency |
| --- | ---: | ---: | ---: | ---: | ---: |
| mixed | 100 | 184 | 5.30 | 9.239% | 29,078.44 ms |
| mixed | 500 | 122 | 2.36 | 18.033% | 49,352.17 ms |
| mixed | 1,000 | 1,604 | 29.16 | 100% | 15,005.60 ms |
| mixed | 5,000 | 12,020 | 172.27 | 100% | 15,023.03 ms |
| harvest | 100 | 145 | 4.36 | 100% | 15,139.14 ms |
| harvest | 500 | 787 | 15.13 | 100% | 15,004.22 ms |

Interpretation: the Node smoke test confirms that the staging API, token flow
and PostgreSQL-backed write path can operate under light concurrency. The k6
campaign is currently a diagnostic result, not a positive performance claim.
The near-15 s latency plateau and 100% error rates in high-VU scenarios suggest
client timeout, pool saturation, container resource limits, rate limiting,
payload/authorization mismatch, or benchmark design issues. These results should
be reported under "Threats to validity / engineering limitations" until the
root cause is fixed and the experiment is rerun.

Recommended paper status: do not claim k6 scalability yet. Use this as a
motivation for the next engineering iteration.

## RQ2 — Input fraud mitigation

Raw files:

- `research/results/fraud-dataset.csv`
- `research/results/fraud-metrics.json`
- `research/results/figures/fraud-confusion-matrix.svg`
- `research/results/figures/fraud-per-rule.svg`

Seeded noisy synthetic dataset:

| Metric | Value |
| --- | ---: |
| Samples | 2,150 |
| Operationally valid cases | 1,430 |
| Injected fraud cases | 720 |
| Precision | 0.9589 |
| Recall | 0.9722 |
| F1 | 0.9655 |
| False positive rate | 0.0210 |
| False negative rate | 0.0278 |

Confusion matrix:

| | Predicted fraud | Predicted valid |
| --- | ---: | ---: |
| Actual fraud | 700 | 20 |
| Actual valid | 30 | 1,400 |

Interpretation: the rule engine detects most injected anomalies while preserving
explicitly modelled false positives and false negatives. The 20 false negatives
represent GPS spoofing that reports an in-geofence coordinate; the 30 false
positives represent operationally legitimate degraded GPS cases. This is useful
for demonstrating the limits of rule-based mitigation but must not be described
as field fraud accuracy.

Recommended figure: use both fraud SVGs, one for the confusion matrix and one
for per-rule precision/recall.

## RQ1/RQ2 — Spatial authority

Raw files:

- `research/results/postgis-benchmark.csv`
- `research/results/postgis-benchmark.txt`
- `research/results/postgis-summary.json`
- `research/results/figures/postgis-latency.svg`

Three warm-up runs and ten measured runs per scale:

| Candidate polygons | Median latency | p95 latency | All matched |
| ---: | ---: | ---: | --- |
| 100 | 0.064 ms | 2.452 ms | yes |
| 1,000 | 0.048 ms | 0.049 ms | yes |
| 10,000 | 0.048 ms | 0.048 ms | yes |
| 100,000 | 0.050 ms | 0.056 ms | yes |

Interpretation: the GiST-indexed spatial lookup remained fast in a local
single-client microbenchmark. This supports the feasibility of server-side
geofence checks but does not replace end-to-end API concurrency evaluation.

## RQ3 — Accessibility and adoption (Dual-Role Mobile Workflows)

Prepared artifacts and dual-role mobile client architecture:

- `research/field-study/PILOT_PROTOCOL_VI.md` (Dual-track: Farmer Harvest vs Collector Transfer)
- `research/field-study/CONSENT_FORM_VI.md`
- `research/field-study/SUS_VI.md` (Vietnamese System Usability Scale for mobile UI)
- `research/field-study/DATA_DICTIONARY.md`

Current status: The Zalo Mini App dual-role onboarding (`FARMER` / `COLLECTOR`), role-phone identity tuple isolation (`role + phone`), offline task queue filtering by `actorId`, and persistent bottom taskboard are fully implemented and verified in local/WebView environments. Formal participant task-completion times and SUS/TAM scores require the upcoming field study on physical mobile devices across farm orchards and trader buying depots. Do not claim numerical task-completion times or SUS scores until field participant trials are complete.

## Figure set for current draft

| Figure | Source file | Manuscript role | Status |
| --- | --- | --- | --- |
| Architecture & Dual-Role Mobile Flow | `apps/web` architecture page / Zalo Mini App dual workflow | System overview & RQ3 | Updated (Live on `/architecture`) |
| Merkle runtime | `research/results/figures/merkle-runtime.svg` | RQ1 scalability | Ready |
| PostGIS latency | `research/results/figures/postgis-latency.svg` | RQ1/RQ2 geofence | Ready |
| Gas comparison | `research/results/figures/gas-comparison.svg` | RQ1 cost | Ready with caveat |
| Fraud confusion matrix | `research/results/figures/fraud-confusion-matrix.svg` | RQ2 accuracy | Ready |
| Fraud per-rule metrics | `research/results/figures/fraud-per-rule.svg` | RQ2 rule behavior | Ready |
| k6 diagnostic table | `research/results/k6-benchmark-staging-suite.md` | Limitation / next work | Diagnostic only |

