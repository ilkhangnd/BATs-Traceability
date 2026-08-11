# BATS - Blockchain-assisted Agricultural Traceability System

# BATs-Traceability

Roadmap thống nhất cho cả sản phẩm và bài báo:
[`ROADMAP_PROJECT_PAPER.md`](ROADMAP_PROJECT_PAPER.md).
Tiến độ cập nhật theo ba luồng Mini App, Website/backend và Paper/NCKH:
[`docs/PROJECT_PROGRESS_STATUS_2026-07-14.md`](docs/PROJECT_PROGRESS_STATUS_2026-07-14.md).

MVP truy xuất nguồn gốc sầu riêng theo hướng **data-first, compliance-first,
blockchain-assisted**. Hệ thống dùng GS1 EPCIS 2.0 làm event model, rule engine để
phát hiện dữ liệu bất thường và blockchain chỉ làm lớp neo bằng chứng.

## Vertical slice hiện có

- Vùng trồng mẫu tại Ea Yông, Krông Pắc, Đắk Lắk với polygon geofence.
- API tạo lô thu hoạch và chuyển trạng thái `harvested → collected → packed → shipped`.
- 7 rule thực thi: geofence, yield, duplicate, time, role, weight và device anomaly.
- SHA-256 canonical hash cho từng EPCIS event.
- Daily Merkle root và proof API.
- GS1 Digital Link chuẩn `/01/{gtin}/10/{lot}/21/{serial}` và EPCIS 2.0
  JSON-LD document endpoint.
- Dashboard lô/vùng trồng và trang public GS1 Digital Link.
- Smart contract EVM chỉ cho phép neo một root mỗi ngày.
- IndexedDB offline queue cho Zalo Mini App.
- PostgreSQL/PostGIS và Anvil bằng Docker Compose.

## Chạy nhanh

Yêu cầu: Node.js 22.13+, pnpm 11.7+.

```bash
cp .env.example .env
pnpm install
pnpm dev
```

Build và chạy stack container theo cấu hình production:

```bash
cp .env.production.example .env.production
# Thay toàn bộ password/secret và URL mẫu trước khi chạy.
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Backend container tự chạy Prisma migration trước khi khởi động và xử lý SIGTERM
để đóng kết nối database an toàn. Anvil không nằm trong production compose.

Chạy staging local theo cấu hình production-like, port tách khỏi dev server:

```bash
# Dùng file mẫu để kiểm thử local; khi triển khai thật hãy copy sang .env.staging
# và thay toàn bộ secret.
pnpm staging:up -- .env.staging.example
pnpm staging:token
pnpm staging:down -- .env.staging.example
```

Staging mở web ở `http://localhost:3400` và API ở `http://localhost:4400`.
`/health` có thể trả `degraded` khi chưa cấu hình `CHAIN_RPC_URL` và
`ANCHOR_CONTRACT_ADDRESS`; database/evidence vẫn phải báo OK. Dockerfile production
chỉ cài dependency cần cho backend/web/shared-types và dùng cache pnpm để tránh
kéo dependency blockchain/Zalo không cần thiết trong image production.

Mở:

- Web: <http://localhost:3000>
- Sơ đồ kiến trúc triển khai: <http://localhost:3000/architecture>
- Quản trị actor/vùng trồng/audit log: <http://localhost:3000/admin>
- Backend health: <http://localhost:4000/health>
- Prometheus metrics: <http://localhost:4000/metrics>
- Swagger UI: <http://localhost:4000/docs>
- OpenAPI JSON: <http://localhost:4000/openapi.json>
- Lô mẫu:
  <http://localhost:3000/verify/8930000000019/SR-20260704-000001/0001>

Backend mặc định dùng persistent Store adapter với Prisma/PostgreSQL/PostGIS.
`BATS_STORAGE=memory` chỉ dành cho unit test hoặc demo độc lập không có database.

## Quản trị và Google Maps

Sao chép `.env.example` thành `.env` để cấu hình backend. Sau đó sao chép
`apps/web/.env.local.example` thành `apps/web/.env.local` và điền
`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. Google Maps key phải được giới hạn theo HTTP referrer
và chỉ bật Maps JavaScript API/Places API cần dùng.

Admin đăng nhập tại `/admin`. Các thao tác xóa là soft delete và đều sinh audit log. Màn hình
vùng trồng dùng Google Maps hybrid, hỗ trợ tìm địa chỉ, vẽ/chỉnh polygon và tính diện tích ha.

## Zalo Mini App

`apps/zalo-mini-app/src/zalo-session.ts` cung cấp cầu nối `zmp-sdk` để lấy access token,
Zalo user ID, GPS, ảnh và trạng thái mạng. Trước khi dùng, cấu hình `ZALO_MINI_APP_ID`,
`ZALO_APP_SECRET` và `ZALO_USER_INFO_URL`; backend sẽ không cấp BATS token nếu chưa xác
minh access token với Zalo hoặc actor chưa được admin gán `zaloUserId`.

Trong giai đoạn chưa cấu hình Zalo API, admin có thể cấp access token tạm tại
`POST /admin/actors/:id/access-token`. Danh sách tích hợp ngoài đang hoãn nằm ở
[`docs/DEFERRED_INTEGRATIONS.md`](docs/DEFERRED_INTEGRATIONS.md).

## Kiểm thử

```bash
pnpm test
pnpm typecheck
pnpm build
pnpm --filter @bats/backend test:e2e
```

E2E test chạy qua HTTP thật với chuỗi đăng nhập → cấp actor token → harvest →
idempotent replay → transfer → local test anchor → Digital Link verification →
EPCIS export. Smart-contract behavior được kiểm tra riêng trong package blockchain.

Backend áp dụng security headers, rate limit theo IP và kiểm tra `Origin` cho
admin mutation dùng cookie. Cấu hình bằng `RATE_LIMIT_MAX`,
`RATE_LIMIT_WINDOW_MS` và `TRUST_PROXY`; production reverse proxy phải ghi đúng
địa chỉ client trước khi bật `TRUST_PROXY=true`.

Anchor scheduler mặc định tắt để tránh gửi giao dịch ngoài ý muốn. Bật bằng
`ANCHOR_SCHEDULER_ENABLED=true`; scheduler sẽ neo ngày nghiệp vụ trước đó,
lưu `pending/confirmed/failed`, `attemptCount`, `lastError` và `nextAttemptAt`
để retry có backoff.

## Bộ thí nghiệm cho bài báo

Các benchmark Merkle, rule-engine, gas, API load và PostGIS nằm tại
[`research/`](research/README.md). Chạy từng phép đo bằng:

```bash
pnpm research:merkle
pnpm research:fraud
pnpm research:gas
```

Kết quả thô được xuất vào `research/results/`. Mô hình toán học và giả thuyết
đánh giá được ghi tại [`research/formal-model.md`](research/formal-model.md).
Bộ chuẩn bị pilot nằm tại
[`research/field-study/`](research/field-study/PILOT_PROTOCOL_VI.md); manuscript
scaffold và claim–evidence map nằm tại
[`research/paper/`](research/paper/MANUSCRIPT_SCAFFOLD.md).

Chạy hạ tầng local khi cần kiểm thử tích hợp:

```bash
docker compose up -d postgis
pnpm --filter @bats/backend db:deploy
pnpm --filter @bats/backend db:seed
docker compose up -d anvil
pnpm --filter @bats/blockchain deploy:local
pnpm --filter @bats/blockchain test
```

Sau `deploy:local`, lấy `contractAddress` từ
`apps/blockchain/deployments/local.json` và điền `ANCHOR_CONTRACT_ADDRESS`.
Với Anvil local, dùng private key account đầu tiên cho `ANCHOR_PRIVATE_KEY`;
không bao giờ dùng khóa này ngoài local development. Admin có thể neo theo ngày
tại tab **Blockchain anchor** hoặc `POST /admin/anchors/:date`.

PostGIS của BATS dùng cổng host `5433` để tránh xung đột với PostgreSQL local
thường dùng `5432`. Với `BATS_STORAGE=postgres`, backend hydrate actor, vùng
trồng, batch, event, evidence metadata và audit log khi khởi động; mọi mutation
được ghi lại bằng Prisma. Geofence vận hành bằng `ST_Covers` trên polygon có
GiST index. Đặt `BATS_STORAGE=memory` khi cần chạy demo/unit test độc lập.

Backup local gồm PostgreSQL custom dump và thư mục evidence:

```bash
pnpm db:backup
# Restore là thao tác ghi đè và bắt buộc xác nhận:
BATS_ALLOW_RESTORE=yes pnpm db:restore -- backups/20260706T051440Z
```

## API chính

```bash
curl -X POST http://localhost:4000/batches/harvest \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer YOUR_ACTOR_ACCESS_TOKEN' \
  -H 'x-idempotency-key: harvest-20260704-device-0001' \
  -d '{
    "farmPlotId":"plot-dlk-0001",
    "variety":"Ri6",
    "quantityKg":850,
    "eventTime":"2026-07-04T10:00:00+07:00",
    "location":{"latitude":12.6789,"longitude":108.1234},
    "evidenceHashes":["sha256-from-upload"]
  }'
```

Upload evidence trước khi gửi hash trong harvest:

```bash
curl -X POST http://localhost:4000/evidence/upload \
  -H 'authorization: Bearer YOUR_ACTOR_ACCESS_TOKEN' \
  -F 'file=@field-photo.jpg'
```

Public verification hỗ trợ tải hồ sơ:

```text
GET /01/:gtin/10/:lot/21/:serial
GET /epcis/:gtin/:lot/:serial
GET /verify/:gtin/:lot/:serial/export/json
GET /verify/:gtin/:lot/:serial/export/csv
GET /verify/:gtin/:lot/:serial/export/pdf
```

GTIN được kiểm tra check digit ở backend. GTIN demo hợp lệ hiện tại là
`8930000000019`; request dùng GTIN sai hoặc không khớp với lô sẽ trả HTTP 400/404.

Các endpoint danh sách `/batches`, `/plots`, `/admin/actors`, `/admin/plots` và
`/admin/audit-logs` trả envelope `{ items, page, pageSize, total, totalPages }`.
Query hỗ trợ `page`, `pageSize` (tối đa 100), `q` và bộ lọc phù hợp như
`status`, `riskBand`, `role`, `province`, `district`, `action`, `targetType`.
Khi `BATS_STORAGE=postgres`, pagination/filtering chạy ở database bằng Prisma
`count/findMany` thay vì tải toàn bộ dữ liệu vào RAM; memory mode chỉ dành cho
unit test/demo nhẹ.

Polygon vùng trồng được kiểm tra tọa độ, self-intersection và overlap ở backend.
Khi dùng PostgreSQL, diện tích do PostGIS tính lại và là giá trị authoritative;
frontend không thể tự khai diện tích để vượt rule năng suất.

Để thử geofence, đổi tọa độ sang `10.0, 106.0`; API vẫn lưu kết quả phục vụ audit nhưng
trả `accepted: false`, risk issue `G` và band tương ứng.

## Ranh giới MVP

Không lưu khóa blockchain ở frontend, không token hóa lô hàng, và không công khai ảnh/chứng
từ nhạy cảm. Zalo/OTP, managed object storage, production signer custody và
actor/organization governance đầy đủ vẫn cần hoàn tất trước pilot. Idempotency hiện đã dùng
atomic database reservation và sequence PostgreSQL, nhưng vẫn cần kiểm thử tải trên staging.
