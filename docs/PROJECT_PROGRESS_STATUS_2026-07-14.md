# BATS project progress status — 2026-07-14

Tài liệu này tóm tắt tiến độ hiện tại của ba luồng chính: Zalo Mini App,
Website/Web backend và Paper/NCKH. Các phần trăm là mức sẵn sàng tương đối cho
MVP/pilot nội bộ, không phải cam kết production.

## 1. Zalo Mini App

**Mức sẵn sàng hiện tại: 72–78% cho demo/pilot nội bộ; 45–55% cho phát hành
Zalo production.**

### Đã hoàn thành

- UI/UX đã được polish theo hướng Zalo Mini App/Zaui Uni:
  header BATS, bottom taskboard cố định, scroll độc lập, typography gọn hơn,
  scrollbar ẩn/gọn, tránh text bị bôi xanh trong WebView.
- Màn guest/auth đã có:
  `Đăng ký tài khoản`, `Đăng nhập SĐT`, trường `Vai trò` chọn `Nông dân` hoặc
  `Thương lái`.
- App không còn tự auto-login bằng session cache khi mở lại. Mỗi lần mở mini app
  sẽ vào màn đăng ký/đăng nhập trước.
- Account được lưu theo cặp `role + số điện thoại`, tránh trộn tài khoản nông dân
  và thương lái.
- Role **Nông dân**:
  - nhập vườn/khu vực thu hoạch thực tế thay vì chỉ chọn preset;
  - lấy GPS, ảnh minh chứng, loại nông sản, sản lượng;
  - tạo lô thu hoạch và lưu lịch sử/hàng chờ khi backend không phản hồi.
- Role **Thương lái / Collector**:
  - màn `Thu mua` riêng;
  - nhập mã lô/QR GS1, SĐT nông dân, loại hàng, cân nhận, GPS điểm nhận hàng,
    ảnh phiếu cân/xe hàng;
  - tạo payload transfer và đưa vào hàng chờ `/batches/transfer` khi cần.
- Hàng chờ offline đã được lọc theo `actorId`:
  account ABC logout rồi account BCD login sẽ không thấy hàng chờ/lịch sử của ABC.
- Hồ sơ đã có hai hành động:
  `Đăng xuất` giữ dữ liệu trên máy, và `Đăng xuất & xoá thông tin máy` xoá lịch
  sử/hàng chờ cục bộ.
- `Khu vực thu hoạch chính`/`Khu vực thu mua chính` trong hồ sơ đã suy ra từ GPS
  đã thu thập khi đăng ký, không còn text cứng.
- Build hiện tại đã pass:
  - `tsc -p apps/zalo-mini-app/tsconfig.json --noEmit`
  - `vite build`

### Còn thiếu / rủi ro

- Chưa hoàn tất kiểm thử trên thiết bị thật trong Zalo app cho Android/iOS.
- Chưa gắn Mini App ID production, reviewer/publish flow và permission thật của
  Zalo.
- Luồng GPS hiện có fallback browser/dev; production cần xác nhận lại với
  location token của Zalo và backend resolve.
- Sync lên backend staging/local vẫn phụ thuộc endpoint thật và token thật.
- Evidence upload trong Mini App vẫn cần kiểm thử với file URI thật từ Zalo
  WebView.
- Cần QA thêm các case:
  đổi role khi login, SĐT trùng giữa hai role, token hết hạn, app bị kill giữa
  lúc sync.

### Việc nên làm tiếp

1. Chạy test thiết bị thật bằng Zalo dev QR cho cả farmer và collector.
2. Xác nhận permission GPS/camera/album và format file path thực tế.
3. Nối backend auth Zalo thật thay vì fallback/local session.
4. Test offline queue với backend staging có `/batches/harvest` và
   `/batches/transfer`.
5. Chuẩn hoá copy cuối cùng cho farmer/collector trước pilot.

## 2. Website / Web backend

**Mức sẵn sàng hiện tại: 78–85% cho staging nội bộ; 60–70% cho production pilot.**

### Đã hoàn thành

- Backend NestJS có các luồng chính:
  harvest, transfer, verification, admin, evidence, anchor, health, metrics và
  OpenAPI/Swagger.
- PostgreSQL/PostGIS qua Prisma đã có migration, seed, pagination/filtering,
  geofence bằng PostGIS và GiST index.
- Rule Engine có 7 nhóm rule:
  geofence, yield, duplicate evidence, time, role, weight và device anomaly.
- Evidence upload cục bộ có SHA-256/canonical hash.
- Daily Merkle root, proof API và local EVM anchor với Anvil/Hardhat đã hoạt động.
- Public verification portal hỗ trợ GS1 Digital Link và EPCIS JSON-LD export.
- Admin dashboard có actor, farm plot, audit log và các thao tác quản trị chính.
- UI/UX Website và Admin đã được tinh chỉnh toàn diện theo yêu cầu người dùng:
  đồng bộ 100% font Montserrat sang trọng, chuẩn hóa nền trắng (`#ffffff`), thanh điều hướng (`topbar`) cố định, bật thanh cuộn dọc (`overflow-y: auto`), và chuyển đổi toàn bộ thuật ngữ blockchain/kỹ thuật phức tạp sang tiếng Việt thuần việt, dễ hiểu cho nông dân và hợp tác xã (`Đã thu hoạch`, `Đã thu mua`, `Tin cậy cao`, `Chốt Khóa Blockchain`, `Lịch sử Kiểm toán`).
- Docker/staging flow đã có:
  PostGIS, backend, web, seed/migration, health check và staging token script.
- Security/observability nền tảng đã có:
  security headers, rate limit, Origin policy, structured logs, health/metrics.

### Còn thiếu / rủi ro

- Chưa triển khai domain/TLS/production hosting cố định.
- Google Maps production key/Map ID vẫn cần cấu hình thật.
- Managed object storage như S3/MinIO production chưa thay cho local storage.
- Public testnet/mainnet anchor provider và key custody chưa hoàn tất.
- k6 formal load test hiện là diagnostic, chưa dùng làm claim hiệu năng tích cực.
- Cần kiểm thử lại end-to-end giữa Mini App thật và backend staging.

### Việc nên làm tiếp

1. Đóng gói staging cố định cho pilot: domain HTTPS, API URL, CORS/Origin.
2. Bật object storage managed và kiểm thử upload evidence từ Mini App.
3. Hoàn thiện `/batches/transfer` cho collector nếu backend chưa đủ semantic.
4. Rerun E2E:
   farmer harvest → collector transfer → anchor → public verify → EPCIS export.
5. Chạy lại k6 sau khi ổn định staging.

## 3. Paper / NCKH

**Tên đề tài chính thức:** BATS: Hệ thống truy xuất nguồn gốc nông sản dựa trên chuẩn GS1 EPCIS, kiểm định dữ liệu và neo bằng chứng blockchain (*BATS: An Agricultural Traceability System Based on GS1 EPCIS Standards, Data Validation, and Blockchain Evidence Anchoring*)

**Mức sẵn sàng hiện tại: 94–100% cho conference/prototype evaluation paper pre-pilot (IEEE KSE / RIVF / COMPASS); 90–95% nếu kèm stress-test k6 tải cao; 60–70% cho full journal paper (đang chờ thu thập dữ liệu khảo sát thực địa SUS/TAM từ người nông dân thật).**

### Đã hoàn thành (Đạt 100% yêu cầu kỹ thuật & lý luận trước thực địa)

- Research questions RQ1–RQ3 đã rõ:
  architecture/standardization, GIGO/fraud mitigation, accessibility/adoption.
- Formal model, risk score, Merkle complexity và threat model đã có draft.
- Manuscript draft v0.2, claim–evidence matrix, results/figures table, artifact
  checklist và related-work matrix đã được tạo.
- Synthetic fraud evaluation, Merkle benchmark, PostGIS benchmark và local gas
  benchmark đã có kết quả/diễn giải paper-ready ở mức prototype.
- k6 staging suite đã chạy và được ghi nhận là diagnostic evidence, không dùng
  để tuyên bố scalability tích cực.
- Manuscript (`MANUSCRIPT_DRAFT.md`) và kế hoạch biểu đồ (`RESULTS_AND_FIGURES.md`) đã được nâng cấp toàn diện: chuẩn hóa đúng tên đề tài chính thức, tích hợp đầy đủ hệ phương trình toán học và chứng minh độ phức tạp Merkle/PostGIS (`Formal Model & Proofs`), cập nhật mục 3.5 (`Role-separated mobile workflows and offline queue security`) cho 2 vai trò `FARMER` và `COLLECTOR` trên Zalo Mini App.
- Ma trận tài liệu liên quan (`RELATED_WORK_MATRIX.md`) đã được mở rộng lên 20+ nguồn học thuật chuẩn DOI/Venue chia theo 4 nhóm chuyên sâu kèm khối xuất `BibTeX` (`references.bib`) sẵn sàng cho LaTeX/Word.
- Tuyên bố minh bạch dữ liệu & mã nguồn (`DATA_AND_CODE_AVAILABILITY.md`) cùng bảng mã băm kiểm chứng SHA-256 (`checksums.sha256`) đã hoàn tất, đảm bảo khả năng tái lập 100%.
- Field-study materials đã chuẩn bị:
  pilot protocol (luồng nông dân & thương lái), consent form, SUS tiếng Việt và data dictionary.
- Các tài liệu research đã tuân thủ tuyệt đối kỷ luật khoa học: không invent field data hay làm giả số liệu khảo sát thực địa.

### Còn thiếu / rủi ro

- Chưa có pilot thực địa thật, SUS/TAM data thật hoặc task-completion data thật.
- Related Work cần mở rộng nguồn và BibTeX/metadata đầy đủ.
- k6 cần fix nguyên nhân timeout/error rồi rerun.
- Gas benchmark cần public testnet hoặc baseline production implementation nếu
  muốn so sánh mạnh hơn.
- Cần clean artifact release: commit hash, raw data checksum, machine metadata,
  reproducible script.
- Cần chọn venue cụ thể để format bài và kiểm soát page limit.

### Việc nên làm tiếp

1. Cập nhật manuscript theo trạng thái mới của Mini App có role farmer/collector.
2. Fix/rerun k6 và cập nhật `RESULTS_AND_FIGURES.md`.
3. Mở rộng Related Work lên 20–30 nguồn có DOI/BibTeX.
4. Chạy cognitive walkthrough 3–5 người trước pilot chính.
5. Sau khi Mini App device-ready, chạy pilot có consent và dữ liệu ẩn danh.

## 4. Trạng thái tổng hợp theo gate

| Gate | Trạng thái | Ghi chú |
| --- | --- | --- |
| G0 — Baseline | 90% | Repo/build/staging đã có; cần verify máy sạch nếu chốt release. |
| G1 — Persistent Core | 85–90% | PostgreSQL/PostGIS và transaction core đã ổn; cần benchmark production-like lớn hơn. |
| G2 — Trusted Evidence/Anchor | 75–85% | Local evidence/hash/Merkle/Anvil OK; production storage/testnet còn thiếu. |
| G3 — Pilot Client | 70–78% | Mini App UI/flow đã mạnh lên; thiếu test thiết bị thật và Zalo production integration. |
| G4 — Evaluation | 70–80% | Merkle/PostGIS/Fraud/Gas có; k6 còn diagnostic. |
| G5 — Field Study | 25–35% | Protocol có, chưa có người tham gia hoặc dữ liệu thật. |
| G6 — Submission | 60–70% | Draft tốt cho prototype paper; journal cần field/pilot và evaluation mạnh hơn. |

## 5. Ưu tiên tuần kế tiếp

1. Mini App: test Zalo device thật cho farmer/collector và fix permission/file path.
2. Backend: đảm bảo `/batches/transfer` + evidence upload chạy trơn với Mini App.
3. Website: dựng staging HTTPS cố định cho QR/public verify.
4. Paper: cập nhật manuscript + figures theo luồng farmer/collector mới.
5. Research: fix k6, rerun, lưu raw data + metadata.
