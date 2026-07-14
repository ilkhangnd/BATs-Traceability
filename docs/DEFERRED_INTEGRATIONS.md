# Deferred external integrations

Các hạng mục dưới đây được chủ động hoãn để backend, database, security và
research artifact tiếp tục phát triển mà không phụ thuộc tài khoản/API bên ngoài.

## Zalo Mini App

- Tạo và xác minh Zalo Mini App ID.
- Cấu hình Zalo user-info endpoint và app secret.
- Xin quyền GPS, camera, album và thông tin người dùng.
- Zalo review, sandbox/device testing và publish production.
- UI ZMP React và SDK bridge sẽ được nối sau; backend hiện dùng access token tạm
  do admin cấp cho actor tại `POST /admin/actors/:id/access-token`.

## Google Maps Platform

- Production API key, billing, HTTP-referrer restrictions và Map ID.
- Code bản đồ vẫn giữ nguyên; PostGIS là nguồn kiểm tra geofence phía server.

## Public blockchain

- Sepolia/Polygon RPC provider, faucet token, explorer verification và production
  signer custody.
- Hardhat/Anvil local đã được nối end-to-end với Anchor Service, PostgreSQL
  receipt và public verification; phần deferred chỉ là public network.

## Object storage

- AWS S3/MinIO managed credentials, bucket policy, signed URL và lifecycle rule.
- Evidence hiện dùng local content-addressed storage với server-side SHA-256.

Không được mô tả các mục trong tài liệu này là “đã tích hợp” trong demo hoặc paper.
