# Submission artifact checklist

- [x] Create a clean baseline Git commit and record commit hash (pre-commit working tree frozen into git history).
- [x] Tag the frozen experimental release (`v1.0.0-prototype`).
- [x] Include Node/pnpm/PostgreSQL/PostGIS/EVM versions (`research/results/environment.json`).
- [x] Include schema, all migrations and seed procedure (`apps/backend/prisma/`).
- [x] Include raw CSV/JSON, scripts and figure-generation commands (`research/results/` and `research/benchmarks/`).
- [x] Add checksums for every result file (`research/results/checksums.sha256`).
- [x] Add database-level pagination/load-test implementation (`apps/backend`).
- [x] Run API benchmark on fixed staging hardware (`api-load-node.json` / `k6-benchmark-staging-suite.md`).
- [x] Replace minimal-token comparison or label it precisely (`research/results/gas-benchmark.json`).
- [x] Add full ERC-721 baseline before making production ERC-721 claims (`FullERC721TraceabilityBaseline.sol` benchmarked via local EVM at 126,554 gas/event).
- [x] Complete literature extraction and verified bibliography (`RELATED_WORK_MATRIX.md` and standalone `references.bib`).
- [ ] Complete ethics review, consent and anonymized pilot dataset (`PILOT_PROTOCOL_VI.md`, `SUS_VI.md`, and `CONSENT_FORM_VI.md` are prepared; physical participant data pending).
- [x] Add data/code availability statements (`DATA_AND_CODE_AVAILABILITY.md`).
- [x] Verify every Abstract number appears in Results.
- [x] Export paper figures in venue-compliant vector/raster formats (`research/results/figures/*.svg`).

## Current notes & boundary discipline

- **Scale & Performance Claims:** k6 has been run, but current high-VU ($N \ge 1{,}000$) results are diagnostic because error/timeout rates are too high for a positive scalability claim. Only report single-node microbenchmarks (`merkle.mjs`, `postgis.sql`, and `api-load-node.mjs` up to 100 VUs) as positive evidence.
- **Gas & Smart Contract Claims:** Both minimal-token (`MinimalBatchTokenBaseline`) and full OpenZeppelin ERC-721 (`FullERC721TraceabilityBaseline`) comparisons are explicitly measured on local EVM (`gas-benchmark.csv`); public mainnet cost regime conversion remains future work.
- **Field & Usability Claims:** No invented or synthetic participant task times or SUS/TAM scores are reported. All user-facing claims are scoped to architectural preparation (`FARMER` vs `COLLECTOR` Zalo Mini App dual-workflow) until the physical field pilot or small-scale Eureka cognitive walkthrough is executed.
- **Verification Manifest:** Checksums are verified directly from the repository root via `shasum -a 256 -c research/results/checksums.sha256`.
