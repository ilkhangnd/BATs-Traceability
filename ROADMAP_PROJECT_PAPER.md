# BATS — Roadmap tổng thể cho Project và Research Paper

Roadmap này biến BATS từ MVP demo thành:

1. một hệ thống đủ ổn định để pilot với nông hộ/HTX; và
2. một research artifact có thí nghiệm tái lập, dữ liệu định lượng và bài báo
   không tuyên bố vượt quá bằng chứng.

Thời lượng đề xuất: **16 tuần**. Hai luồng Project và Paper chạy song song,
nhưng Paper chỉ được chốt kết quả sau khi các experiment gate tương ứng hoàn tất.

## Trạng thái triển khai

- **G0 — gần hoàn tất:** Git repository, CI workflow, Node 22 baseline,
  multi-stage production images, production Compose và staging script đã được
  tạo. Backend/web images build thành công; staging local xác nhận web HTTP 200,
  backend migration + PostGIS + evidence volume + admin login/token. Dockerfile
  đã tối ưu để production image chỉ cài backend/web/shared-types dependency và
  dùng pnpm cache. Còn kiểm chứng setup trên một máy sạch độc lập trước khi đóng gate.
- **G1 — core hoàn tất, đang harden:** Prisma schema, 6 migration, seed,
  persistent Store adapter, PostGIS geometry/GiST và `ST_Covers` đã chạy thành
  công trên database local cổng `5433`. Transaction nghiệp vụ, atomic
  idempotency reservation và PostgreSQL batch sequence đã có concurrency test.
  API pagination/filtering có giới hạn, backup/restore local và OpenAPI 3.0 với
  Swagger UI đã có. Database-level pagination/filtering đã chạy bằng Prisma
  `count/findMany` ở PostgreSQL và có integration test; còn benchmark quy mô lớn
  trước khi đóng gate production.
- **G5 — đã mở phần chuẩn bị:** protocol pilot, consent draft, SUS tiếng Việt
  và data dictionary đã có. Chưa tuyển người tham gia; chỉ được bắt đầu sau
  ethics/supervisor review và khi Mini App chạy được trên thiết bị thật.
- **G6 — đã nâng lên bản conference/prototype-draft (Đạt 85–90% cho NCKH/Eureka; 80–88% cho Conference; 55–65% cho Journal):** manuscript v0.3, bounded abstract, claim–evidence matrix, results/figures table, Related Work matrix + file `references.bib` độc lập, tuyên bố minh bạch `DATA_AND_CODE_AVAILABILITY.md` (đúng đường dẫn repo), mục 5.6 (thiết kế pilot nhỏ 3–5 người cho Eureka), k6 diagnostic analysis và artifact checklist đã hoàn tất. Còn thực thi pilot nhỏ 3–5 người, k6 high-load hardening sau scale-up, và chốt baseline Git tag `v1.0.0-prototype`.
- **G2 — đang thực hiện:** operational RBAC, admin-issued temporary actor token,
  retry idempotency, local evidence upload/SHA-256 và daily Merkle anchor trên
  Anvil đã có. Receipt được lưu PostgreSQL; verification API kiểm tra cả proof
  lẫn root trên contract. Anchor scheduler/retry đã có trạng thái
  `pending/confirmed/failed`, `attemptCount`, `lastError` và `nextAttemptAt`.
  Zalo API, public testnet, Google production key và managed object storage được
  deferred tại `docs/DEFERRED_INTEGRATIONS.md`.
- **G3 — pilot client đang thực hiện:** server-side polygon validation, PostGIS
  area/overlap detection, proof-aware public portal và dossier export
  JSON/CSV/PDF đã hoàn tất. Zalo Mini App đã có guest auth, role `Nông dân` /
  `Thương lái`, farmer harvest flow, collector receiving flow, offline queue,
  history/profile và actor-scoped queue filtering. Zalo device testing,
  production Zalo auth/permissions và review/publish vẫn deferred.
- **G4 — đang thực hiện:** structured request logs, request ID, Prometheus
  metrics, component health checks, security headers, CSRF Origin policy và
  observable IP rate-limit đã có; log/metric phân biệt đúng status exception
  4xx/5xx, bao gồm HTTP 429. PostGIS đã chạy 3 warm-up + 10 lần
  đo tại mỗi quy mô; Merkle đã chạy 10 lần. Rule Engine đã có đủ G/Y/D/T/R/W/A
  và noisy synthetic evaluation có FP/FN cùng per-rule metrics. Staging
  production-like chạy trên `localhost:3400/4400`; Node smoke/load runner đã
  chạy 3 VU trong 5 giây trên staging local, 1.094 request thành công và 0 lỗi.
  k6 staging suite đã chạy nhưng đang là kết quả diagnostic với error/timeout
  cao, chưa được dùng làm claim scalability tích cực.
- **E2E workflow — hoàn tất local:** HTTP test bao phủ admin login, actor token,
  harvest, idempotent replay, transfer, local Merkle anchor, Digital Link verify
  và EPCIS 2.0 export. EVM behavior tiếp tục được kiểm tra ở contract test riêng.

## Mục tiêu và Research Questions

- **RQ1 — Architecture and standardization:** Kiến trúc hybrid, data-first,
  GS1 EPCIS và daily Merkle anchor có đạt hiệu năng/chi phí phù hợp trong điều
  kiện kết nối yếu không?
- **RQ2 — Input fraud mitigation:** Rule Engine và PostGIS giảm GIGO đến mức
  nào, với Precision, Recall, F1, FPR và FNR bao nhiêu?
- **RQ3 — Accessibility and adoption:** Zalo Mini App offline-first có giúp
  nông hộ hoàn thành tác vụ nhanh và dễ tiếp cận hơn không?

## Các cổng hoàn thành

| Gate | Kết quả bắt buộc | Điều kiện được đi tiếp |
| --- | --- | --- |
| G0 — Baseline | Build/test tái lập, Git và cấu hình mẫu | Không phụ thuộc dữ liệu chỉ tồn tại trong RAM |
| G1 — Persistent Core | PostgreSQL/PostGIS là nguồn dữ liệu chính | Restart dịch vụ không mất dữ liệu; geofence chạy bằng `ST_Contains` |
| G2 — Trusted Evidence | Upload, hash, idempotency, daily anchor thật | Có tx hash và client kiểm tra được Merkle proof |
| G3 — Pilot Client | Zalo Mini App có UI và offline sync | Hoàn thành luồng harvest/transfer trên thiết bị thật |
| G4 — Evaluation | API/PostGIS/Merkle/gas/fraud benchmark hoàn tất | Có raw data, metadata máy và protocol tái lập |
| G5 — Field Study | Pilot, task time và SUS/TAM hoàn tất | Có consent, dữ liệu ẩn danh và phân tích thống kê |
| G6 — Submission | Manuscript, figures, references và artifact package | Mọi claim trong Abstract đều truy ngược được về kết quả |

## Lộ trình 16 tuần

### Phase 0 — Baseline và quản trị nghiên cứu (Tuần 1)

#### Project

- Khởi tạo Git repository và quy ước branch/commit.
- Bổ sung CI cho typecheck, unit test, build và smart-contract test.
- Chuẩn hóa `.env.example`; loại bỏ secret/password mặc định khỏi production.
- Tạo Dockerfile và một lệnh khởi chạy local có thể tái lập.
- Chốt ERD production và chính sách định danh batch/event.

#### Paper

- Chốt RQ1–RQ3, hypotheses và biến đo.
- Đăng ký trước experimental protocol nội bộ.
- Tạo bibliography và tiêu chí chọn Related Work 2021–2026.
- Ghi cấu hình phần cứng/phần mềm cho mọi benchmark.

#### Definition of Done

- Một máy sạch có thể cài đặt, migrate, test và chạy hệ thống theo README.
- Không commit secret.
- Mỗi RQ có ít nhất một phép đo và một tiêu chí bác bỏ giả thuyết.

### Phase 1 — Persistent Core và PostGIS (Tuần 2–4)

#### Project

- Cài Prisma Client và thay `StoreService` bằng repository PostgreSQL.
- Hoàn thiện schema cho:
  `actors`, `farm_plots`, `batches`, `epcis_events`, `evidence_files`,
  `validation_results`, `anchors`, `audit_logs`, `idempotency_keys`.
- Lưu polygon bằng PostGIS geometry; tạo GiST index.
- Chuyển geofence sang `ST_Covers`/`ST_Contains` có test điểm biên.
- Bổ sung transaction khi tạo batch, event, validation và evidence metadata.
- Thêm seed data, pagination, filtering và backup/restore script.
- Bổ sung DTO validation, error contract và OpenAPI.

#### Paper

- Viết bản nháp System Architecture và Data Model.
- Formalize risk score \(R(E,C)\), violation functions và Merkle complexity.
- Chạy thử PostGIS benchmark để sửa protocol, chưa dùng số liệu warm-up làm kết quả.

#### Definition of Done

- Restart backend không mất actor, plot, batch và audit log.
- Integration test chạy với PostgreSQL/PostGIS thật.
- Query plan chứng minh GiST index được sử dụng.

### Phase 2 — Security, Evidence và Blockchain Anchor (Tuần 5–6)

#### Project

- Bảo vệ harvest/transfer bằng authentication và role guard.
- Lấy actor từ session/token, không tin `actorId` do client gửi.
- Thêm idempotency cho offline sync.
- Xây Evidence Service:
  upload, MIME/size validation, SHA-256, MinIO/S3 abstraction và signed URL.
- Xây Anchor Service:
  gom event theo ngày, tạo root, gửi contract, lưu tx/block/chain ID.
- Viết scheduler có retry và trạng thái `pending/confirmed/failed`.
- Trả proof gồm leaf index/direction; xác minh root từ chain.
- Thêm deploy script cho testnet và quy trình quản lý private key.

> Trạng thái hiện tại: phần security/idempotency/local evidence được triển khai
> trước. Anchor scheduler/retry đã hoàn tất ở backend nhưng mặc định tắt bằng
> cấu hình. Zalo API, public testnet và managed S3 được hoãn, không chặn local
> vertical slice.

#### Paper

- Định nghĩa threat model: giả mạo actor, GPS, evidence, replay và compromised key.
- Chốt ba gas baselines:
  full ERC-721, direct event logging và BATS daily root.
- Ghi rõ phần nào được bảo vệ bởi blockchain và phần nào vẫn phụ thuộc oracle.

#### Definition of Done

- Một event được tạo, hash, đưa vào daily tree, neo lên EVM và kiểm tra lại end-to-end.
- Request replay không tạo event trùng.
- Không có private key trong frontend hoặc repository.

### Phase 3 — Web, Verification và Zalo Mini App (Tuần 7–9)

#### Project

- Hoàn thiện admin:
  chọn farmer, reactivate, search/filter, logout và audit chi tiết.
- Kiểm tra polygon phía server: tọa độ, tự cắt, diện tích và vùng chồng lấn.
- Public portal tự xác minh Merkle proof, hiển thị tx/block explorer.
- Thêm QR/GS1 Digital Link và export JSON/CSV/PDF có phân quyền.
- Tạo ZMP React application đầy đủ:
  login, harvest form, GPS, ảnh, transfer, queue status và retry.
- Gắn access token cho sync; hỗ trợ refresh/expired session.
- Kiểm thử offline/online trên Android và iOS trong Zalo.

#### Paper

- Thiết kế task protocol cho RQ3.
- Chuẩn bị bảng hỏi SUS 10 câu, consent form và phiếu quan sát.
- Thực hiện cognitive walkthrough với 3–5 người trước pilot chính.

#### Definition of Done

- Nông dân có thể tạo một lô khi offline và hệ thống đồng bộ đúng một lần khi có mạng.
- Người kiểm tra QR có thể xác minh proof mà không cần ví Web3.
- Không công khai evidence nhạy cảm trên public portal.

> Trạng thái hiện tại: web admin, blockchain anchor, public proof và dossier
> export đã có. Backend cung cấp Digital Link chuẩn, kiểm tra GTIN check digit
> và xuất EPCIS 2.0 JSON-LD/CBV-aligned document. Zalo Mini App UI hiện đã có
> farmer/collector flow, offline queue và account-scoped history/queue. Device
> test trong Zalo, production Zalo auth/permission và Zalo review/publish vẫn
> được hoãn theo `docs/DEFERRED_INTEGRATIONS.md`.

### Phase 4 — Hardening và Experimental Evaluation (Tuần 10–11)

#### Project

- Thêm end-to-end test cho harvest → transfer → anchor → verify.
- Thêm logging có cấu trúc, metrics, health check DB/storage/chain.
- Thêm rate limit, secure headers, CSRF strategy và dependency audit.
- Tạo staging environment cố định cho thí nghiệm.

> Trạng thái hiện tại: staging script `pnpm staging:up -- .env.staging.example`
> đã build/start được PostGIS, backend và web; seed chạy trước backend để tránh
> bootstrap phụ thuộc dữ liệu mẫu. Web trả HTTP 200, backend `/health` kết nối
> được database/evidence và báo `degraded` khi chưa cấu hình public chain.

#### Paper

- **API:** k6 tại 100, 500, 1.000 và 5.000 VU; báo cáo RPS, p50, p95, p99 và error rate.
- **PostGIS:** \(10^2,10^3,10^4,10^5\) polygon; warm-up và ít nhất 10 lần đo.
- **Merkle:** \(10^3\) đến \(10^6\) leaves; root/proof/verify time và proof size.
- **Gas:** đo contract thật; không đổi tên minimal token thành ERC-721.
- **Fraud:** dữ liệu có nhiễu, trường hợp biên và nhãn độc lập; báo cáo per-rule metrics.
- Lưu raw CSV/JSON, commit hash, machine metadata và script phiên bản tương ứng.

#### Definition of Done

- Mỗi biểu đồ có raw data và lệnh tái tạo.
- Có confidence interval hoặc mô tả phân phối phù hợp.
- Không dùng F1=1.0 từ deterministic boundary dataset như field accuracy.

### Phase 5 — Pilot thực địa và HCI (Tuần 12–13)

#### Project

- Pilot với 10–30 hộ/HTX tại Đắk Lắk.
- Hỗ trợ thiết bị yếu, mất mạng và quy trình khôi phục dữ liệu.
- Thu thập lỗi vận hành, không thu thập dữ liệu cá nhân vượt nhu cầu.
- Sửa các lỗi blocker; đóng băng phiên bản nghiên cứu sau pilot.

#### Paper

- Đo task completion rate và completion time.
- Thu SUS; nếu dùng TAM, xác định construct và cách tính trước khi khảo sát.
- Ghi số lần cần hỗ trợ, lỗi sync và tỷ lệ bỏ tác vụ.
- Phân tích định lượng và thematic notes đã ẩn danh.
- Viết Limitations và Threats to Validity.

#### Definition of Done

- Có dataset ẩn danh, data dictionary và consent record.
- Phân biệt rõ kết quả pilot với kết quả synthetic.
- Mọi thay đổi rule sau khi nhìn dữ liệu phải được ghi nhận để tránh data leakage.

### Phase 6 — Viết và nộp bài (Tuần 14–16)

#### Paper

- Tuần 14: Introduction, Related Work, Architecture và Methodology.
- Tuần 15: Results, Discussion, Limitations, figures và tables.
- Tuần 16: Abstract, Conclusion, artifact appendix và format theo venue.
- Kiểm tra citation, plagiarism, figure readability và page limit.
- Chọn venue theo độ sâu kết quả:
  KSE/RIVF cho prototype + evaluation;
  IEEE Access hoặc tạp chí chuyên ngành khi có pilot và thực nghiệm mạnh hơn.

#### Project

- Tag release dùng trong paper.
- Đóng gói artifact gồm source, migration, seed, scripts và anonymized results.
- Tạo demo video và deployment snapshot.

#### Definition of Done

- Abstract chỉ chứa số đã xuất hiện trong Results.
- Related Work dùng nguồn thật, không dùng citation placeholder.
- Người khác có thể tái tạo bảng/biểu đồ từ artifact package.

## Ma trận thí nghiệm và trạng thái hiện tại

| Experiment | RQ | Hiện trạng | Còn phải làm |
| --- | --- | --- | --- |
| Merkle scalability | RQ1 | Đã chạy 10 lần đến \(10^6\), có metadata/checksum | Bổ sung confidence interval khi viết paper |
| Gas analysis | RQ1 | Hardhat + minimal baselines | Full ERC-721, testnet và cost conversion |
| API load | RQ1 | Node smoke 3 VU/5s đạt 1.094/1.094 success, p95 30.562 ms; k6 suite 100–5.000 VU đã chạy | k6 hiện error/timeout cao, cần debug rồi rerun trước claim scalability |
| PostGIS geofence | RQ1/RQ2 | Đã chạy query plan + 10 lần/scale đến \(10^5\) | Lặp lại trên staging server để kiểm tra external validity |
| Fraud accuracy | RQ2 | 2.150 mẫu noisy synthetic, đủ G/Y/D/T/R/W/A và per-rule metrics | Thay bằng nhãn pilot độc lập trước claim field accuracy |
| Offline reliability | RQ3 | Có Mini App queue cho farmer/collector và actor-scoped queue filtering | Chưa có device-level Zalo network-condition experiment |
| Task completion | RQ3 | Chưa có | Pilot thiết bị thật |
| SUS/TAM | RQ3 | Chưa có | Consent, survey và analysis |

## Backlog ưu tiên

### P0 — Chặn pilot

1. Zalo Mini App device testing trong Zalo thật cho farmer/collector.
2. Google Maps production key/Map ID cho môi trường public demo.
3. Public testnet RPC/contract/signer custody hoặc quyết định giữ local-chain cho pilot kỹ thuật.
4. API load trên staging để bắt lỗi concurrency trước pilot.
5. Kiểm chứng staging trên một máy sạch độc lập.
6. Quy trình backup/restore/pilot support rehearsal.

### P1 — Chặn claim khoa học mạnh

1. Kiểm định interoperability/certification cho EPCIS 2.0/CBV document hiện có.
2. Rule R/A và dataset có nhãn độc lập.
3. Full gas baselines.
4. API/PostGIS experiments.
5. Pilot HCI/SUS.
6. Related Work có hệ thống.

### P2 — Sau submission hoặc production scale

1. Consortium/multisig anchor governance.
2. OCR chứng từ và anomaly model học máy.
3. Viễn thám/EUDR integration.
4. Multi-crop, multi-province và multilingual portal.

## Quy tắc quản lý claim

- **Có code** không đồng nghĩa **đã được đánh giá**.
- **Synthetic accuracy** không đồng nghĩa **field accuracy**.
- **Local EVM gas** không đồng nghĩa **chi phí mainnet thực tế**.
- **GS1-inspired types** không đồng nghĩa **EPCIS 2.0 certified compliance**.
- **Local Merkle root** không đồng nghĩa **đã neo blockchain**.
- Mỗi claim định lượng phải trỏ đến raw result, script, commit và môi trường chạy.

## Nhịp thực hiện hằng tuần

- Thứ Hai: chốt milestone và experiment cần chạy.
- Thứ Tư: review code, schema và dữ liệu thô.
- Thứ Sáu: chạy test/benchmark cố định, cập nhật bảng trạng thái.
- Cuối mỗi phase: chỉ đóng gate khi Definition of Done có bằng chứng kiểm tra được.
