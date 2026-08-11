# BATS manuscript scaffold

Status: evidence-grounded working draft; citations and field-study results are
intentionally incomplete.

## Candidate title

**A standards-aligned hybrid architecture for blockchain-assisted agricultural traceability under intermittent connectivity**

## One-sentence argument

In smallholder agricultural traceability, we show that a GS1 EPCIS-aligned,
data-first architecture can combine server-side input validation with
constant-size daily blockchain commitments, supported by local PostGIS, Merkle,
gas and synthetic fraud experiments, while field usability and external fraud
detection remain to be established.

## Draft abstract

Agricultural traceability systems must preserve interoperable event histories
without imposing blockchain transaction management on smallholder users.
Existing blockchain prototypes often record application-specific data directly
on-chain and therefore neither address unreliable input nor separate operational
storage from tamper-evident commitments. Here we introduce BATS, a hybrid
traceability architecture that represents supply-chain events using a GS1
EPCIS 2.0-aligned model, validates field submissions using seven rule families
and PostGIS geofences, and anchors one Merkle root per day on an EVM network.
In local experiments, Merkle-root generation for one million leaves required a
median of 580.2 ms, whereas proof verification required 0.0156 ms and a
640-byte proof. Indexed spatial queries remained at a median of 0.050 ms for
100,000 synthetic polygons in a single-client microbenchmark. A seeded noisy
synthetic dataset yielded precision 0.897, recall 0.972 and F1 0.933; these
values characterize injected cases rather than field accuracy. The daily anchor
used a median of 94,666 gas in a local EVM benchmark, but comparison with a
production ERC-721 implementation and a public network remains pending.
Together, these results support the computational feasibility of the
data-first, anchor-first design. They do not yet establish usability,
interoperability certification or effectiveness under field deployment.

## Section architecture

### 1. Introduction

1. Export traceability requires interoperable event histories and accessible data entry.
2. Blockchain protects committed data but does not correct garbage-in/garbage-out.
3. Per-event on-chain designs create cost and usability barriers.
4. Gap: standards alignment, input validation, intermittent connectivity and compact anchoring are rarely evaluated together.
5. Contributions: architecture, rule formulation, Merkle commitment and reproducible prototype evaluation.

### 2. Related work

- Agricultural blockchain traceability: [SYSTEMATIC SEARCH AND CITATIONS REQUIRED].
- EPCIS 2.0 and standards-based event exchange: [PRIMARY GS1 SOURCES REQUIRED].
- Oracle/GIGO mitigation and spatial validation: [CITATIONS REQUIRED].
- Offline-first and super-app interaction for smallholders: [CITATIONS REQUIRED].

No comparison table may be finalized until every row is linked to a verified source.

### 3. System architecture and methodology

- Five-layer architecture and trust boundaries.
- GS1 Digital Link identity and EPCIS 2.0-aligned JSON-LD event document.
- Seven validation functions \(G,Y,D,T,R,W,A\) and risk score \(R(E,C)\).
- PostGIS polygon authority and `ST_Covers`.
- Canonical event hash, daily Merkle tree and EVM root registry.
- Authentication, RBAC, evidence hashing and idempotent offline replay.

### 4. Implementation

- TypeScript monorepo: NestJS, Next.js, Prisma/PostgreSQL/PostGIS and Solidity.
- Local content-addressed evidence storage.
- Admin portal, public verification and offline queue scaffold.
- Explicitly deferred: Zalo production APIs, managed object storage and public signer custody.

### 5. Experimental evaluation

1. Merkle construction/proof/verification across \(10^3\)–\(10^6\) leaves.
2. Indexed PostGIS geofence lookup across \(10^2\)–\(10^5\) polygons.
3. Local EVM gas baselines and limitations of the minimal token comparator.
4. Seven-rule noisy synthetic fraud evaluation with per-rule errors.
5. [PENDING] API load at 100–5,000 VU on a fixed PostgreSQL staging server.
6. [PENDING] Pilot completion time, sync reliability and SUS.

### 6. Discussion

- Meaning of separating operational data from immutable commitments.
- What rule-based validation catches and what GPS spoofing can evade.
- Local benchmark external-validity limits.
- Governance and signer compromise.
- Standards-aligned output is not equivalent to EPCIS certification.

### 7. Conclusion

Draft only after pending experiments. The conclusion must distinguish
computational feasibility from field adoption and fraud-prevention efficacy.

## Claim–evidence map

| Claim | Evidence | Status |
|---|---|---|
| Daily on-chain commitment is \(\Theta(1)\) in event count | Formal model and contract design | Supported analytically |
| Merkle workflow scales to \(10^6\) leaves locally | 10-run benchmark and raw CSV | Supported locally |
| Indexed geofence lookup is fast to \(10^5\) polygons | PostGIS local microbenchmark | Supported locally |
| Rule engine detects injected noisy cases | 2,150-sample seeded synthetic dataset | Supported synthetically |
| BATS reduces gas against direct/minimal-token baselines | Local EVM benchmark | Supported for stated baselines |
| BATS saves against full ERC-721 | No full ERC-721 baseline | Needs evidence |
| Mini App task time is below 60 s | No field pilot | Needs evidence |
| SUS exceeds 70 | No field pilot | Needs evidence |
| System improves real-world fraud detection | No independent field labels | Needs evidence |

## Ghi chú cấu trúc

- Abstract bắt đầu từ bài toán, sau đó mới giới thiệu BATS.
- Mỗi con số đều lấy từ artifact hiện có và kèm giới hạn.
- Related Work chỉ có protocol/placeholder; không tạo citation giả.
- Results đi theo evidence ladder: system → computational validation → baseline → field study.
