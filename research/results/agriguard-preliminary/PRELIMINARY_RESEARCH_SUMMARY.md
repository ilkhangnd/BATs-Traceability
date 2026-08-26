# BATS-AgriGuard preliminary research summary

> **These results are synthetic scenario/rule-coverage measurements from an incomplete preliminary prototype and are not estimates of real-world fraud-detection accuracy.**

## Scope

This report hardens presentation of the unchanged preliminary rule executions. It does not validate field performance, tune the dataset, or alter either engine. Unsupported BATS v1 capabilities are coverage limitations, not detector defects.

## Dataset

24 independently labelled synthetic scenarios (12 legitimate, 12 adversarial), 27 events, seed `0x51a7c0de`. Labels remain stored in the scenario manifest independently of detector code.

## Full-scope synthetic scenario coverage

| Engine | Supported | Partial | Unsupported | TP | FP | TN | FN | Precision | Recall | F1 | FPR | FNR |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Preliminary PCIE | 24 | 0 | 0 | 12 | 0 | 12 | 0 | 100.00% | 100.00% | 100.00% | 0.00% | 0.00% |
| Frozen BATS v1 | 7 | 8 | 9 | 5 | 0 | 12 | 7 | 100.00% | 41.67% | 58.82% | 0.00% | 58.33% |

This view retains all 24 scenarios for transparent rule and capability coverage. It must not be presented as an apples-to-apples accuracy estimate.

## Common-support comparison

Predeclared policy `bats-v1-supported-only-v1`: Include a scenario only when the frozen BATS v1 adapter classifies its semantic support as supported. Exclude partial and unsupported scenarios regardless of either engine's detection outcome.

| Engine | Supported | Partial | Unsupported | TP | FP | TN | FN | Precision | Recall | F1 | FPR | FNR |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Preliminary PCIE | 7 | 0 | 0 | 2 | 0 | 5 | 0 | 100.00% | 100.00% | 100.00% | 0.00% | 0.00% |
| Frozen BATS v1 | 7 | 0 | 0 | 1 | 0 | 5 | 1 | 100.00% | 50.00% | 66.67% | 0.00% | 50.00% |

Included: 7; excluded: 17. Membership was selected from semantic support before metric calculation, never from correctness.

| Excluded scenario | Classification | Semantic reason |
|---|---|---|
| LEG-003 | partial | BATS v1 does not declare boundary-inclusive ST_Covers-equivalent geometry semantics. |
| LEG-004 | partial | BATS v1 actor ownership is not equivalent to time-bounded plantation authorization. |
| LEG-005 | unsupported | BATS v1 cannot resolve plantation authorization history at eventTime. |
| LEG-006 | unsupported | BATS v1 cannot resolve versioned plantation status at eventTime. |
| LEG-010 | unsupported | BATS v1 has no provenance-scoped mass-balance model. |
| LEG-011 | unsupported | BATS v1 has no provenance-scoped mass-balance model. |
| LEG-012 | partial | BATS v1 only partially projects the custody vocabulary and does not validate custody locations. |
| ADV-002 | partial | BATS v1 actor ownership is not equivalent to time-bounded plantation authorization. |
| ADV-003 | unsupported | BATS v1 cannot resolve plantation authorization history at eventTime. |
| ADV-004 | unsupported | BATS v1 cannot resolve versioned plantation status at eventTime. |
| ADV-006 | unsupported | BATS v1 has no provenance-scoped mass-balance model. |
| ADV-007 | unsupported | BATS v1 has no provenance-scoped mass-balance model. |
| ADV-008 | unsupported | BATS v1 has no provenance-scoped mass-balance model. |
| ADV-009 | partial | BATS v1 only partially projects the custody vocabulary and does not validate custody locations. |
| ADV-010 | partial | BATS v1 does not validate custody source or destination locations. |
| ADV-011 | partial | The authorization component is not semantically equivalent in BATS v1. |
| ADV-012 | partial | BATS v1 lacks provenance mass balance and only partially projects custody transitions. |

See `agriguard-support-matrix.csv` and `agriguard-support-matrix.md` for every scenario.

## True remove-one-rule ablation

| Configuration | Recall | F1 | Delta recall vs Full | Delta F1 vs Full |
|---|---:|---:|---:|---:|
| Full | 1.0000 | 1.0000 | 0.0000 | 0.0000 |
| Full-G | 0.9167 | 0.9565 | -0.0833 | -0.0435 |
| Full-I | 0.8333 | 0.9091 | -0.1667 | -0.0909 |
| Full-S | 0.9167 | 0.9565 | -0.0833 | -0.0435 |
| Full-Y | 0.9167 | 0.9565 | -0.0833 | -0.0435 |
| Full-M | 0.7500 | 0.8571 | -0.2500 | -0.1429 |
| Full-C | 0.8333 | 0.9091 | -0.1667 | -0.0909 |

Each row is an actual full engine re-run with the named rule removed. Within the current scenario suite, removing M produces the largest recall and F1 decrease; this is not a general rule-importance claim.

## Mass-balance sensitivity

The unchanged grid evaluates 6 scenarios (3 legitimate, 3 adversarial) over 16 predeclared rho/epsilon configurations. Within this fixed suite, stricter recovery assumptions can create false positives by flagging legitimate process loss, while larger tolerance can reduce recall by accepting adversarial over-output. No best threshold is selected post hoc.

## Performance

PCIE label: **local in-memory/single-process rule-engine microbenchmark**. p50 0.005620 ms/event, p95 0.020172, p99 0.022801 across 1350 measured event evaluations. This excludes API, database, EPCIS, Merkle, and blockchain work.

<!-- AGRIGUARD_POSTGIS_START -->
PostGIS label: **single-client indexed ST_Covers lookup benchmark**. This is not API or end-to-end latency.

| Polygons | Median (ms) | p95 (ms) | p99 (ms) | All matched |
|---:|---:|---:|---:|:---:|
| 100 | 0.284 | 3.345 | 3.345 | yes |
| 1,000 | 0.260 | 0.358 | 0.358 | yes |
| 10,000 | 0.076 | 0.223 | 0.223 | yes |
| 100,000 | 0.078 | 0.218 | 0.218 | yes |

Measurement source: server-side clock_timestamp via Docker psql. Database metadata: `{"databaseName":"bats","postgresqlVersion":"16.4 (Debian 16.4-1.pgdg110+2)","postgisVersion":"3.4.3"}`.
<!-- AGRIGUARD_POSTGIS_END -->

Machine metadata is recorded in `environment.json`; database metadata is recorded by the PostGIS runner. Timing files are intentionally absent from deterministic hashes.

## Reproducibility hashes

| Deterministic artifact | SHA-256 |
|---|---|
| research/scenarios/agriguard/preliminary-scenarios.json | `094d68e3f5591dc907d38ce86453d1e324e6453da7bd0696bc9f443e33e52207` |
| research/results/agriguard-preliminary/agriguard-dataset.csv | `1e8f7f60d2d6bbc93fc6fddb349918c13b25c6ec94cce9ff38948d3a86a72746` |
| research/results/agriguard-preliminary/agriguard-metrics.json | `355dce4b71889298179e7028305d981de18fdf7299fa6c16da22e34e62975bf9` |
| research/results/agriguard-preliminary/agriguard-common-support-metrics.json | `7a40aa9dcea6a5da6f4b90f698b68c4be790836504b29fd3a61f41ad3863d35c` |

## Limitations

- Perfect PCIE coverage on hand-authored fixtures is expected and does not demonstrate generalization.
- This is a small synthetic suite with no field prevalence, sampling frame, external validation, or confidence intervals.
- Common-support results cover only seven scenarios and omit partial or unavailable BATS v1 semantics.
- Registry and policy data are immutable fixtures, not production persistence models.
- Sensitivity behavior is descriptive for six fixed cases and is not threshold optimization.
- Microbenchmarks exclude network concurrency and end-to-end system costs.

## Exact reproduction commands

```text
pnpm research:agriguard
pnpm research:agriguard:postgis
pnpm --filter @bats/backend test
pnpm --filter @bats/backend test:integration
pnpm --filter @bats/backend typecheck
pnpm --filter @bats/backend build
git diff --check
```
