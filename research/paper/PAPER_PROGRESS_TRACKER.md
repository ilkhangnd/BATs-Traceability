# Paper progress tracker

Updated: 2026-07-15.

Goal from user: raise NCKH/paper items toward 85–90% where feasible without
inventing field data, fully synchronizing claim matrices with local EVM benchmarks.

## Progress by item

| Item | Previous state | Current state after this update | Realistic Progress | Remaining blocker |
| --- | --- | --- | ---: | --- |
| Official Paper Title | Drafted / English | Official Vietnamese & English formal title finalized across all manuscript files | 100% | None |
| Research questions | Drafted | RQ1–RQ3 fully mapped to results and claims | 100% | Final venue framing |
| Formal model & Proofs | Drafted separately | Mathematical equations, risk scoring formula \(R(E,C)\), and Merkle/PostGIS complexity proofs integrated directly into `MANUSCRIPT_DRAFT.md` | 95% | Proof-read inside final venue LaTeX template |
| Manuscript Draft | v0.2 draft created | Evidence-bounded v0.3 draft complete with exact title, formal proofs, dual-role mobile workflows, and Section 5.6 (Eureka small-scale pilot) | 88–90% | Final formatting into target venue LaTeX/Word template |
| Abstract | Bounded draft | Fully quantitative abstract reflecting measured local benchmarks and exact k6 diagnostic boundaries | 90% | Adjust k6 stress numbers after staging rerun |
| Results section | Consolidated | Complete quantitative results (`RESULTS_AND_FIGURES.md`) mapped to verified single-client raw artifacts | 90% | Add confidence intervals if required by venue |
| Claim discipline | Dedicated matrix | Complete `CLAIM_EVIDENCE_MATRIX.md` aligned with full OpenZeppelin ERC-721 local EVM data | 95% | Keep in sync with upcoming pilot and stress tests |
| Related Work & BibTeX | Verified-source draft | Comprehensive 20+ screened academic source matrix + standalone `references.bib` BibTeX export | 85% | Final DOI/venue metadata polish during LaTeX assembly |
| k6 API load analysis | Diagnostic analysis | Diagnostic analysis documented (`K6_LOAD_ANALYSIS.md`), explicitly bounded out of scalability claims | 75% | Run dedicated load-hardening profile & resolve staging timeouts |
| Merkle evaluation | Paper-ready table | Complete raw data (median 580.173 ms for 1M events), complexity proof \(\Theta(1)\), and SVG figures | 95% | Final figure caption check |
| PostGIS evaluation | Paper-ready table | Complete single-client microbenchmark (median 0.050 ms for 100K polygons), $O(\log M + K)$ proof, and `EXPLAIN ANALYZE` logs | 90% | Multi-client spatial concurrent stress test optional |
| Fraud evaluation | Paper-ready metrics | Complete synthetic evaluation (precision 0.9589, recall 0.9722, F1 0.9655) with boundary analysis | 90% | Real-world field labels required only for extended journal claims |
| Gas evaluation | Local baseline | Complete Hardhat local EVM gas comparison (`FullERC721TraceabilityBaseline.sol` 126,554 gas/event vs BATS daily root 94,755 gas) | 85–90% | Public mainnet fiat cost conversion across multiple chains |
| Eureka / NCKH Pilot Design | Protocol only | Protocol (`PILOT_PROTOCOL_VI.md`, `EUREKA_PILOT_GUIDE.md`) updated with softened scientific claims | 88–90% | Execute physical 3–5 user pilot run with real human participants |
| Field study results | Not started | Explicitly marked blocked, zero invented field data (`pilot-results.json` clean) | 20–30% | Physical participant execution & SUS/TAM survey collection |
| Data & Code Availability | Missing / Mismatched | Open-source reproducibility statement aligned with exact monorepo paths (`@bats/backend`, `@bats/web`, `@bats/blockchain`, `@bats/zalo-mini-app`) & SHA-256 manifest | 95% | Final repository freeze tag |
| Artifact checklist | Status clarified | Checksums pass 100%; realistic notes recorded (`ARTIFACT_CHECKLIST.md`) | 95% | Clean Git commit & tag (`v1.0.0-prototype`) + pilot dataset |

## Updated overall paper readiness (Strict, Realistic Assessment)

| Track | Mức sẵn sàng thực tế | Status & Next Action |
| --- | ---: | --- |
| **Bài NCKH / Eureka dạng prototype ứng dụng + đánh giá kỹ thuật** | **85–90%** | **Đủ nền chắc chắn để nộp NCKH/Eureka; cần chạy thêm pilot nhỏ 3–5 người (theo Mục 5.6) để lấy dữ liệu usability tối thiểu cho vòng bảo vệ** |
| **Conference paper kỹ thuật, chưa có pilot thực địa** | **80–88%** | Đóng gói bản thảo sang template LaTeX của hội nghị (IEEE KSE / RIVF / COMPASS); chốt tag git |
| **Journal paper / bài có field-study mạnh** | **60–65%** | Đã hoàn thiện full ERC-721 local EVM baseline (`FullERC721TraceabilityBaseline`); cần chạy khảo sát thực địa SUS/TAM trên nhóm nông dân/thương lái thực tế |

## New & Modified files in this update

- `CLAIM_EVIDENCE_MATRIX.md` (Updated row 24 & 25 to reflect measured local EVM ERC-721 baseline versus BATS Merkle anchoring)
- `EUREKA_PILOT_GUIDE.md` (Soften conclusion wording to scientifically accurate "cung cấp bằng chứng ban đầu về khả năng giảm rào cản kỹ thuật Web3")
- `PAPER_PROGRESS_TRACKER.md` (Updated gas status, evaluation progress, and synchronization of claim matrices)
- `apps/blockchain/contracts/FullERC721TraceabilityBaseline.sol` (OpenZeppelin ERC721URIStorage baseline implementation)
- `apps/blockchain/scripts/gas-benchmark.ts` (Automated 4-way EVM benchmark harness)
- `research/benchmarks/summarize-pilot.mjs` (CLI summary utility for calculating real field study SUS & TAM scores when collected)

## Next closing actions (The final 10–15% polish)

1. **Conduct the 3–5 User Eureka Cognitive Walkthrough:** Execute the planned `FARMER` (harvest) and `COLLECTOR` (transfer) workflows with 3–5 users on staging to record baseline task completion times ($T_{\text{task}}$) and SUS scores (`SUS_VI.md`).
2. **Git Baseline Freeze:** Create the clean baseline Git commit and tag (`v1.0.0-prototype-freeze`).
3. **Venue Template Formatting:** Assemble `MANUSCRIPT_DRAFT.md` and `references.bib` into the formal LaTeX target conference/journal template (`.tex`).
4. **k6 Hardening:** Keep high-concurrency k6 API results in limitation section unless container timeout bottlenecks are resolved on staging.
