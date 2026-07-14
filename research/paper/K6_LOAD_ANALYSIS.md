# k6 load-test analysis

Status: diagnostic analysis, updated 2026-07-11.

Raw files:

- `research/results/k6-benchmark-staging-suite.json`
- `research/results/k6-benchmark-staging-suite.md`
- `research/results/api-load-*.json`

## What changed

The workspace now contains formal k6 result files. Older roadmap text said k6
had not been run; that is outdated. The correct status is:

> k6 has been run against staging, but the results are diagnostic and currently
> show high latency and high error rates. They should not be used as positive
> scalability evidence until the root cause is fixed and the suite is rerun.

## Observed results

| Scenario | Target VUs | Requests | RPS | Error rate | p95 latency |
| --- | ---: | ---: | ---: | ---: | ---: |
| mixed | 100 | 184 | 5.30 | 9.239% | 29,078.44 ms |
| mixed | 500 | 122 | 2.36 | 18.033% | 49,352.17 ms |
| mixed | 1,000 | 1,604 | 29.16 | 100% | 15,005.60 ms |
| mixed | 5,000 | 12,020 | 172.27 | 100% | 15,023.03 ms |
| harvest | 100 | 145 | 4.36 | 100% | 15,139.14 ms |
| harvest | 500 | 787 | 15.13 | 100% | 15,004.22 ms |

## Interpretation

The fixed ~15 s latency plateau in several scenarios is a strong signal of
timeout-driven failure rather than normal service-time distribution. The mixed
100/500 VU runs have non-zero successes but very high p95 latency, while the
harvest-only runs fail completely. This points to an issue in at least one of:

1. token generation or token expiry during the suite;
2. benchmark payload mismatch;
3. rate-limit or CSRF/origin policy affecting k6;
4. database connection pool saturation;
5. container CPU/memory limits on local Docker;
6. one expensive write path under concurrent harvest creation;
7. k6 timeout configuration too low for the current staging environment.

## Paper usage

Do:

- cite these results as a current limitation;
- use them to justify the next engineering iteration;
- keep them out of the abstract and core "system is scalable" claims.

Do not:

- average these with the Node smoke result;
- call the current k6 campaign a successful throughput benchmark;
- use the 5,000 VU result as evidence of production readiness.

## Next diagnostic protocol

1. Run read-only `/health` and `/verify` k6 scenarios to separate networking
   from write-path bottlenecks.
2. Run authenticated harvest at 1, 5, 10, 25 and 50 VUs before jumping to 100.
3. Record backend logs, database connection count and container CPU/memory.
4. Disable or raise rate-limit only for a dedicated benchmark profile.
5. Confirm each k6 request carries a fresh actor token and unique idempotency key.
6. Export raw k6 summaries and backend metrics with the same timestamp.

Only after the above passes should the paper report 100/500/1,000/5,000 VU
results.

