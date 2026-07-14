# BATS Staging Load Benchmark Results (k6)

Tested against BATS Staging Docker Container (`http://localhost:4400`) with PostGIS spatial query verification and daily Merkle hash generation.

| Scenario | Target VUs | Total Reqs | Throughput (RPS) | Error Rate (%) | Latency Avg (ms) | Latency P95 (ms) | Latency P99 (ms) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **mixed** | 100 | 184 | **5.3** | 9.239% | 13365.08 | **29078.44** | 29685.64 |
| **mixed** | 500 | 122 | **2.36** | 18.033% | 22182.76 | **49352.17** | 50236.22 |
| **mixed** | 1000 | 1,604 | **29.16** | 100% | 15001.56 | **15005.6** | 15020.59 |
| **mixed** | 5000 | 12,020 | **172.27** | 100% | 15390.49 | **15023.03** | 15329.75 |
| **harvest** | 100 | 145 | **4.36** | 100% | 15016.27 | **15139.14** | 15284.98 |
| **harvest** | 500 | 787 | **15.13** | 100% | 15001.51 | **15004.22** | 15016.27 |
