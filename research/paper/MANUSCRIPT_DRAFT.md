# Manuscript draft v0.3

Status: evidence-bounded draft, updated 2026-07-14.

Target venues: NCKH / Giải thưởng Eureka (`Công nghệ thông tin / Công nghệ phần mềm ứng dụng trong nông nghiệp`); KSE/RIVF-style IEEE conference.

## Title

**Vietnamese Official Title:** BATS: Hệ thống truy xuất nguồn gốc nông sản dựa trên chuẩn GS1 EPCIS, kiểm định dữ liệu và neo bằng chứng blockchain
**English Title:** BATS: An Agricultural Traceability System Based on GS1 EPCIS Standards, Data Validation, and Blockchain Evidence Anchoring

## Abstract

Agricultural traceability systems need interoperable event histories, accessible
data entry for smallholders and tamper-evident audit trails. Blockchain can
make committed records difficult to alter, but it does not solve the
garbage-in/garbage-out problem and per-event blockchain logging can impose cost
and usability barriers. We present BATS, a hybrid traceability architecture for
durian supply chains that stores operational events off-chain using a GS1
EPCIS 2.0-aligned model, validates field submissions through seven rule
families and PostGIS geofences, and anchors a daily Merkle root to an EVM smart
contract. In local experiments, Merkle-root generation for one million leaves
required a median of 580.173 ms, while proof verification required 0.0156 ms
with a 640-byte proof. Indexed spatial lookup over 100,000 synthetic polygons
achieved a median of 0.050 ms in a single-client PostGIS benchmark. A seeded
noisy synthetic validation dataset yielded precision 0.9589, recall 0.9722 and
F1 0.9655. A local EVM benchmark measured 94,755 median gas for one daily root
versus 126,554 gas per event for a full OpenZeppelin ERC-721 traceability baseline,
supporting the empirical cost advantage of anchor-first commitment over per-event
transactions under the stated baselines. Current k6 staging results reveal
high error rates under heavy concurrency, and field usability data are not yet
available. The results therefore support the computational feasibility of
BATS, while leaving production load hardening, public-chain deployment and
smallholder usability as open evaluation steps.

## 1. Introduction

Fresh agricultural exports increasingly require product-level provenance,
evidence trails and rapid verification across organizations. For commodities
such as durian, a traceability system must link a batch to its planting area,
harvest event, actors, transfers, evidence files and public verification page.
The technical challenge is not only to store this information. The system must
also keep data interoperable, prevent accidental or malicious duplicate
submissions, validate whether field claims are plausible and remain usable for
smallholders who may not understand wallets, gas fees or blockchain key
management.

Many blockchain traceability prototypes treat blockchain as the primary data
store. This improves immutability of submitted records, but it can increase
cost and does not solve the oracle problem: an immutable false record is still
false. In agricultural settings, important risk signals appear before anchoring:
a harvest coordinate may fall outside a registered planting area, a claimed
yield may exceed agronomic bounds, an actor may attempt to perform a role they
are not authorized to perform, or an offline device may replay a stale request.
For this reason, BATS uses a data-first and anchor-first design. Operational
events remain in PostgreSQL/PostGIS and are expressed as EPCIS-aligned
visibility events; blockchain stores only a daily Merkle commitment.

This paper makes four contributions:

1. a five-layer hybrid architecture for agricultural traceability that combines
   EPCIS-aligned event modelling, PostGIS spatial authority, evidence hashing
   and EVM anchoring;
2. a formal risk-scoring model with seven validation rule families for
   human-entered field events;
3. an implemented TypeScript prototype with admin dashboard, public
   verification, local evidence storage, PostgreSQL/PostGIS persistence and
   smart-contract anchoring;
4. a reproducible evaluation suite covering Merkle scalability, PostGIS
   spatial lookup, local gas baselines, synthetic fraud detection and
   diagnostic API load tests.

The scope of this draft is intentionally bounded. We do not claim field fraud
accuracy, EPCIS certification, public-chain production readiness or
smallholder usability until the corresponding evaluations are complete.

## 2. Related Work

Prior literature has shown broad interest in blockchain for agriculture and
food supply chains. Reviews of blockchain in agriculture identify transparency
benefits but also adoption barriers related to infrastructure, policy,
education and farmer readiness. Configurable agri-food blockchain systems
reduce application-development effort, while IoT-enabled smart-agriculture
architectures use smart contracts and sensors to automate trust. Other work
targets efficiency in blockchain traceability or food-chain logistics
platforms. These systems motivate BATS but also reveal three gaps.

First, many prototypes use custom data structures, while industry traceability
requires exchangeable event semantics. BATS therefore uses EPCIS 2.0-aligned
event documents and CBV-like business vocabulary fields. Second, several
blockchain systems assume that captured data are trustworthy or sensor-derived;
BATS treats input plausibility as a first-class problem and validates
human-entered submissions before anchoring. Third, farmer-facing blockchain
interfaces can create usability barriers. BATS abstracts blockchain away from
the farmer workflow and prepares an offline-first Zalo Mini App path, although
the field study remains pending.

See `RELATED_WORK_MATRIX.md` for the current comparison table and source list.

## 3. System Architecture and Methodology

BATS is organized into five layers. The client layer contains the public
verification portal, web dashboard and Zalo Mini App scaffold. The API and
traceability layer is a NestJS backend that exposes harvest, transfer,
evidence, verification, admin and anchor endpoints. The validation layer
contains the rule engine and risk-score calculator. The storage layer contains
PostgreSQL/PostGIS and local content-addressed evidence storage. The blockchain
anchor layer computes daily Merkle roots and records them in an EVM smart
contract.

### 3.1 Event model

Each traceability event is represented as an EPCIS-style object event with
event time, action, business step, disposition, read point, business location,
objects and instance/lot master data. The public route follows a GS1 Digital
Link-style identity pattern `/01/{gtin}/10/{lot}/21/{serial}`. The current
prototype is EPCIS-aligned but has not passed formal EPCIS conformance testing.

### 3.2 Formal validation model and risk scoring

To mitigate the garbage-in/garbage-out (GIGO) problem inherent in human-entered field data, BATS models input plausibility as a normalized, bounded scoring function over context \(C\). Let a candidate EPCIS event be \(E\), the enabled validation rule set be \(\mathcal{I}=\{G,Y,D,T,R,W,A\}\) (Geofence, Yield, Duplicate evidence, Time window, Role authorization, Weight consistency, and Device anomaly), and \(w_i\) the configured integer weight of rule \(i\). Each normalized violation function \(\delta_i(E, C)\in[0,1]\) is evaluated against context \(C\), which contains the registered PostGIS polygon, actor roles, device signatures, evidence hashes, and historical harvest ledger records.

The composite risk score \(R(E, C)\) is defined as:

\[
R(E, C) = \min\left(100, \sum_{i\in\mathcal{I}} w_i \cdot \delta_i(E, C)\right)
\]

In the current v1 validation engine, individual violation functions \(\delta_i(E, C)\) operate deterministically. For spatial geofence validation (\(G\)) and seasonal yield bounds (\(Y\)), the functions are formulated as:

\[
\delta_G(E, C) =
\begin{cases}
0, & p_E \in P_C \\
1, & p_E \notin P_C
\end{cases}
\qquad
\delta_Y(E, C) = \mathbb{1}\left[
q_E + \sum_{e\in H(C)} q_e > 20{,}000 \cdot A_C
\right]
\]

where \(p_E = (\text{lat}_E, \text{lon}_E)\) is the reported field coordinate, \(P_C\) is the registered PostGIS polygon geometry (`SRID 4326`), \(q_E\) is the submitted batch weight in kilograms, \(H(C)\) represents prior verified harvests for the plot in the active agricultural season, and \(A_C\) is the authoritative plot area in hectares derived directly from `ST_Area(ST_Transform(polygon, 3857))` on the database server. Frontend-submitted area or coordinate claims are never trusted blindly.

Risk bands are segmented into:
- **Green (Tin cậy cao / Valid):** \(R(E, C) \leq 30\), eligible for automated processing.
- **Yellow (Cần kiểm tra / Flagged):** \(30 < R(E, C) \leq 70\), requiring cooperative or supervisory audit.
- **Red (Rủi ro cao / Rejected):** \(R(E, C) > 70\), triggering automatic ingestion block or quarantine.

### 3.3 Evidence and idempotency

Evidence files are uploaded to local content-addressed storage in the current
prototype. The server calculates SHA-256 hashes and associates evidence hashes
with traceability events. Offline replay is controlled through idempotency keys:
repeated submissions with the same actor, endpoint and request hash return the
stored response rather than creating duplicate events.

### 3.4 Merkle anchoring and complexity bounds

To decouple off-chain operational query flexibility from on-chain immutability, BATS anchors daily cryptographic snapshots. For \(N\) canonical EPCIS event payloads \(E_1, E_2, \dots, E_N\) committed on business day \(d\), BATS computes canonical hashes \(h_k = \text{SHA-256}(\text{canonicalize}(E_k))\) and constructs a balanced binary Merkle tree with root \(r_d\).

**Storage Complexity Proof:** Because only the 32-byte daily root \(r_d\) is submitted via `commitDailyRoot(bytes32 root, string date)` to the EVM smart contract, the on-chain storage growth \(S_{\text{on-chain}}(N)\) is strictly bounded by:

\[
S_{\text{on-chain}}(N) = \Theta(1) \quad \text{per day}
\]

In contrast, direct per-event on-chain logging incurs \(S_{\text{direct}}(N) = \Theta(N)\) state mutations. For \(N = 1{,}000\) daily events, BATS reduces on-chain storage writes by \(99.9\%\).

**Verification Complexity Proof:** Generating an inclusion proof for leaf \(h_k\) requires collecting \(\lceil \log_2 N \rceil\) sibling hashes along the path from leaf to root. Thus, client-side cryptographic verification complexity \(V(N)\) requires:

\[
V(N) = O(\log N) \quad \text{hash evaluations}
\]

**Spatial Query Complexity:** For \(M\) registered candidate polygons in PostGIS, point-in-polygon verification `ST_Intersects(geometry, point)` utilizes GiST R-tree spatial indexing. The expected query time \(T_{\text{spatial}}(M, K)\) to identify \(K\) intersecting geofences is bounded by:

\[
T_{\text{spatial}}(M, K) = O(\log M + K)
\]

This ensures sub-millisecond geofence evaluation even when scaling to \(M = 100{,}000\) registered agricultural plots across nationwide cooperatives.

### 3.5 Role-separated mobile workflows and offline queue security

To address the usability and accessibility requirements of smallholder farmers and local agricultural collectors under intermittent internet connectivity, the client layer implements a role-separated dual workflow via a lightweight Zalo Mini App interface:

1. **Strict Role Isolation at Onboarding:** To prevent account confusion and unauthorized cross-role submissions on shared family or farm devices, authentication binds identities to a strict tuple `(role, phone_number)`. When a user selects `FARMER` (Nông dân), the application restricts access exclusively to harvest logging (`/batches/harvest`) and plot geometry association. When a user selects `COLLECTOR` (Thương lái / Thu gom), the application routes them to a dedicated transfer/purchase interface (`/batches/transfer`) tailored for recording batch handoffs, weighing slip verification, and receiving point coordinates.
2. **Offline-First Event Queuing and Security:** Because orchard and farm plots frequently experience degraded cellular connectivity (`3G/EDGE` or offline), all client actions are executed offline-first. Harvest captures and purchase transfers are serialized into local persistent queues. Crucially, offline queues are scoped and filtered strictly by `actorId`. If an actor logs out and another actor authenticates on the same mobile device, local queue reads and background synchronization routines isolate previously queued items, ensuring that pending submissions from one role cannot be viewed, modified, or synced by an unauthorized subsequent account.

## 4. Implementation

The prototype is implemented as a TypeScript monorepo. The backend uses NestJS,
Prisma and PostgreSQL/PostGIS. The web dashboard and public portal use Next.js
with full Vietnamese localization and accessible typography (Montserrat). The smart
contract is developed and tested with Hardhat and Anvil. The Zalo Mini App client
implements the offline-first dual-role workflow (`FARMER` and `COLLECTOR`),
featuring role-phone onboarding isolation, persistent taskboard status tracking,
local SHA-256 evidence hashing, and fallback background synchronization for
`/batches/harvest` and `/batches/transfer`. Production Zalo API permission
hardening and field usability scoring (SUS/TAM) remain pending evaluation.

The admin dashboard supports actor management, soft deletion, plot management
and audit logs. The public portal supports Digital Link-style verification,
EPCIS JSON-LD export and dossier export in JSON, CSV and PDF. The backend also
exposes Prometheus-style metrics, structured request logs, component health
checks, rate limiting and CSRF Origin checks for admin mutations.

The production-like Docker staging environment starts PostGIS, runs migrations
and seed data, then starts backend and web containers. The current staging
health endpoint reports degraded when public blockchain RPC and contract address
are not configured, while database and evidence storage remain operational.

## 5. Experimental Evaluation

### 5.1 Merkle scalability

The Merkle benchmark evaluates daily event counts from \(10^3\) to \(10^6\),
with ten measured runs per size. At one million events, root construction had a
median runtime of 580.173 ms and p95 of 627.967 ms. Proof verification remained
lightweight, with a median of 0.0156 ms and proof size of 640 B. These results
support the feasibility of browser/server verification for daily commitments.

### 5.2 Spatial query benchmark

The PostGIS benchmark evaluates indexed point-in-polygon lookup across
synthetic polygon tables from \(10^2\) to \(10^5\) candidate rows. At 100,000
polygons, median latency was 0.050 ms and p95 latency was 0.056 ms in a
single-client microbenchmark. This supports the design choice of server-side
geofence validation, while leaving end-to-end concurrent API performance to
separate load tests.

### 5.3 Synthetic fraud evaluation

The seeded synthetic dataset contains 2,150 cases: 1,430 operationally valid
cases and 720 injected fraud cases. The rule engine achieved precision 0.9589,
recall 0.9722 and F1 0.9655. The 20 false negatives model GPS spoofing that
reports an in-geofence coordinate, while the 30 false positives model legitimate
degraded GPS conditions. This result demonstrates known strengths and limits of
rule-based validation but does not establish field accuracy.

### 5.4 Gas benchmark

The local EVM benchmark measured a median of 94,755 gas for a BATS daily root (`anchorDailyRoot`), compared with 126,554 gas per event for a full OpenZeppelin ERC-721 traceability baseline (`FullERC721TraceabilityBaseline`), 48,559 gas per event for a minimal batch-token baseline (`MinimalBatchTokenBaseline`), and 44,164 gas per event for direct event logging (`DirectEventLogBaseline`). At 1,000 projected events, the daily-anchor approach uses 94,755 gas total compared with 126,554,000 gas for the full ERC-721 approach (99.9251% gas savings). This confirms the empirical cost advantage of committing one root per day over per-event NFT minting. Public network cost conversion across mainnet gas regimes remains future work.

### 5.5 API load diagnostics

A Node smoke runner generated 1,094 successful harvest requests with 3 VUs over
5 seconds, with p95 latency 30.562 ms. This confirms the staging API under light
concurrency. A k6 staging suite has also been run, but it currently shows high
error rates and timeout-like latency at larger VU counts. Therefore, k6 results
are treated as diagnostic evidence rather than scalability evidence.

### 5.6 Planned Small-Scale Usability Pilot & Cognitive Walkthrough (Pre-Submission Eureka / NCKH Evaluation)

To bridge the gap between our technical prototype evaluation and large-scale longitudinal field deployment, BATS establishes a structured small-scale usability validation protocol specifically tailored for academic pre-submission review (such as NCKH / Eureka):
1. **Participant Scope & Cohort Selection:** A qualitative evaluation cohort consisting of 3 to 5 real-world participants divided into two distinct operating roles: 3 smallholder farmers (`FARMER`) representing agricultural production, and 2 local logistics collectors (`COLLECTOR`) representing post-harvest aggregation.
2. **Cognitive Walkthrough & Task Execution:** Under controlled field/staging conditions, participants execute standard lifecycle tasks using their personal mobile devices inside the Zalo ecosystem:
   - **FARMER Task (`T1`):** Open Zalo Mini App, select agricultural plot (`plotId`), record crop harvest batch with GPS coordinate verification (`/batches/harvest`), and verify offline queueing behavior.
   - **COLLECTOR Task (`T2`):** Scan farmer batch QR code via camera, verify input parameters against rule-engine risk bands, and submit custody transfer confirmation (`/batches/transfer`).
3. **Metrics & Qualitative Baseline:** The protocol captures quantitative task completion time ($T_{\text{task}}$), first-try error rate ($E_{\text{rate}}$), and standardized System Usability Scale (SUS) scores via the localized `SUS_VI.md` questionnaire.
4. **Current Status & Discipline:** In strict accordance with our scientific methodology (`No Invented Field Data`), this section outlines the methodological design and ready-state protocol. No synthetic participant completion times or estimated SUS scores are reported. The experimental harness and mobile UI (`apps/zalo-mini-app/`) are fully instrumented to execute this 3–5 user pilot as the immediate next step prior to final Eureka oral defense.

## 6. Discussion

BATS supports the architectural claim that agricultural blockchain traceability
does not require per-event on-chain storage. The daily Merkle root captures a
tamper-evident commitment while keeping operational data queryable and
updatable off-chain. This separation is particularly important for EPCIS-style
visibility data, which may need rich filtering, exports and internal audit logs.

The evaluation also clarifies the limits of rule-based validation. Geofence and
yield checks can detect many implausible submissions, but they cannot prove that
a truthful-looking coordinate was genuinely measured at the field. BATS should
therefore be interpreted as GIGO mitigation, not GIGO elimination. Future work
could combine device attestation, remote sensing, OCR, farm audits and
multi-party endorsements.

The most important current weakness is the incomplete field and load
evaluation. The Zalo Mini App direction is promising for Vietnamese smallholder
accessibility, but no SUS score or task-time result exists yet. The k6 results
also show that the staging write path or benchmark configuration needs
hardening before strong API scalability claims can be made.

## 7. Threats to Validity

Internal validity is limited by synthetic fraud labels and deterministic rule
thresholds. External validity is limited because PostGIS and Merkle benchmarks
were run locally and do not represent a managed cloud deployment. Construct
validity is limited because EPCIS alignment has not been certified by a
conformance test. Ecological validity for smallholders is not established until
the Zalo Mini App is tested with real users and intermittent connectivity.

## 8. Conclusion

BATS demonstrates a feasible hybrid architecture for standards-aligned,
blockchain-assisted agricultural traceability. The current prototype combines
EPCIS-aligned event modelling, server-side PostGIS validation, rule-based risk
scoring, evidence hashing and daily Merkle anchoring. Local benchmarks support
the computational feasibility of Merkle verification, indexed geofence lookup,
synthetic rule evaluation and constant-size daily anchoring. The next steps are
to fix heavy-load k6 failures, deploy a public-chain anchor, complete Zalo
device testing and run a field pilot with task-time and SUS measurements.

