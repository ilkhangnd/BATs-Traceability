#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE="${1:-}"

if [[ -z "$SOURCE" || ! -f "$SOURCE/database.dump" ]]; then
  echo "Cách dùng: BATS_ALLOW_RESTORE=yes $0 <thu-muc-backup>" >&2
  exit 2
fi

if [[ "${BATS_ALLOW_RESTORE:-}" != "yes" ]]; then
  echo "Restore sẽ ghi đè database local. Đặt BATS_ALLOW_RESTORE=yes để xác nhận." >&2
  exit 3
fi

docker compose --project-directory "$ROOT_DIR" exec -T postgis \
  pg_restore --username bats --dbname bats --clean --if-exists --no-owner --no-privileges \
  < "$SOURCE/database.dump"

if [[ -f "$SOURCE/uploads.tar.gz" ]]; then
  tar -C "$ROOT_DIR" -xzf "$SOURCE/uploads.tar.gz"
fi

echo "Đã restore database và evidence BATS từ: $SOURCE"
