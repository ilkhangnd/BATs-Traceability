# BATS: GS1 EPCIS-Aligned Agricultural Traceability with Data Validation and Blockchain Evidence Anchoring

This repository accompanies the revised manuscript **“BATS: GS1 EPCIS-Aligned
Agricultural Traceability with Data Validation and Blockchain Evidence Anchoring”**
by Dinh-Khang Nguyen and Tuan-Dung Tran (University of Information Technology,
Vietnam National University Ho Chi Minh City).

## Abstract

BATS is a validation-before-anchoring architecture for agricultural traceability.
It records durian harvest and custody updates as GS1 EPCIS 2.0-aligned
`ObjectEvent`s, stores operational data in PostgreSQL/PostGIS, screens each
submission using seven deterministic rule families, and commits one daily Merkle
root to an EVM registry. This design keeps implausible records out of the audit
trail while making on-chain cost independent of event volume.

The manuscript reports local evaluation results including a 613.389 ms median
construction time for a one-million-leaf Merkle root, 0.0166 ms proof
verification, 0.050 ms indexed spatial lookup over 100,000 polygons, 94,755 gas
per daily root, and F1 0.9333 for the generator-labelled rule-boundary
integration test. These measurements validate the specified implementation
boundaries; they are not a claim of field fraud-detection accuracy.

## Research artefacts

- `apps/backend/` — NestJS implementation of the traceability API, validation,
  idempotency, evidence, and anchoring services.
- `apps/blockchain/` — Hardhat contracts and gas-benchmark scripts.
- `apps/web/` and `apps/zalo-mini-app/` — web portal and mobile workflow client.
- `packages/shared-types/` — EPCIS, GS1, canonical-JSON, and rule definitions.
- `research/benchmarks/` — deterministic benchmark and load-test scripts.
- `research/results/` — raw measurements, checksums, plots, and generated
  figures used in the manuscript.

## Reproduce the local environment

Requirements: Node.js 22.13+ and pnpm 11.7+.

```bash
cp .env.example .env
pnpm install
pnpm test
pnpm typecheck
```

Run the benchmark suites and regenerate their outputs:

```bash
pnpm research:merkle
pnpm research:fraud
pnpm research:gas
```

The project also includes PostGIS and an Anvil EVM node for local integration
testing:

```bash
docker compose up -d postgis anvil
pnpm --filter @bats/backend db:deploy
pnpm --filter @bats/backend db:seed
pnpm --filter @bats/blockchain deploy:local
pnpm --filter @bats/blockchain test
```

## Scope and limitations

The implementation is EPCIS-aligned, not a certified EPCIS conformance
implementation. The rule weights and thresholds are design parameters, and the
generator labels share definitions with the detector. Version-2 domain-separated
Merkle hashing, signed receipts, threshold signing, concurrency/crash-recovery
testing, full load telemetry, EPCIS conformance tests, and independently labelled
field evaluation remain future work.

