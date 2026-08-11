# Current measured results

These numbers are local measurements, not production guarantees. Raw CSV/JSON,
query plans, environment metadata and SHA-256 checksums are stored beside this
file.

## PostGIS

Three warm-up runs and ten measured `ST_Contains` queries per scale:

| Polygons | Median | p95 |
| ---: | ---: | ---: |
| 100 | 0.064 ms | 2.452 ms |
| 1,000 | 0.048 ms | 0.049 ms |
| 10,000 | 0.048 ms | 0.048 ms |
| 100,000 | 0.050 ms | 0.056 ms |

The GiST index was used at every scale. This is a single-client spatial-query
microbenchmark, not end-to-end API throughput.

## Merkle

Ten measured runs per scale:

| Events | Root median | Root p95 | Verify median | Proof size |
| ---: | ---: | ---: | ---: | ---: |
| 1,000 | 0.679 ms | 1.757 ms | 0.0067 ms | 320 B |
| 10,000 | 5.561 ms | 8.636 ms | 0.0110 ms | 448 B |
| 100,000 | 55.379 ms | 67.158 ms | 0.0128 ms | 544 B |
| 1,000,000 | 580.173 ms | 627.967 ms | 0.0156 ms | 640 B |

All generated proofs verified successfully.

## API load status

A Node smoke runner succeeded on staging with 3 VUs for 5 seconds:

| VUs | Requests | Error rate | RPS | p95 |
| ---: | ---: | ---: | ---: | ---: |
| 3 | 1,094 | 0% | 218.258 | 30.562 ms |

A k6 staging suite has also been run, but it is currently diagnostic rather
than paper-positive:

| Scenario | Target VUs | Error rate | p95 |
| --- | ---: | ---: | ---: |
| mixed | 100 | 9.239% | 29,078.44 ms |
| mixed | 500 | 18.033% | 49,352.17 ms |
| mixed | 1,000 | 100% | 15,005.60 ms |
| mixed | 5,000 | 100% | 15,023.03 ms |
| harvest | 100 | 100% | 15,139.14 ms |
| harvest | 500 | 100% | 15,004.22 ms |

The k6 results should be used to debug the staging write path, timeout settings
or benchmark configuration before making API scalability claims.

## Still pending

- Field fraud accuracy and SUS/TAM remain pending pilot data.
- Gas results use local Hardhat and minimal baselines; they are not mainnet cost
  guarantees.
- k6 must be rerun after diagnosing the current timeout/error behaviour.

## Noisy synthetic fraud evaluation

The current seeded dataset contains 2,150 cases:

| Metric | Value |
| --- | ---: |
| Precision | 0.8974 |
| Recall | 0.9722 |
| F1 | 0.9333 |
| FPR | 0.0559 |
| FNR | 0.0278 |

The 20 false negatives model GPS spoofing that still reports an in-geofence
coordinate. The 80 false positives model legitimate operational noise: boundary
GPS drift, edge-case yield entries, reused documents, bulk entry sessions, proxy
actor submissions, weighing differences from moisture loss and degraded GPS
accuracy. This is deliberately less flattering—and more useful—than the previous
boundary-derived F1=1.0 result.
