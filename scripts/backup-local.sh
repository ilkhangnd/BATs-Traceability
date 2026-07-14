#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TIMESTAMP="$(date -u +"%Y%m%dT%H%M%SZ")"
BACKUP_ROOT="${BATS_BACKUP_DIR:-"$ROOT_DIR/backups"}"
TARGET="$BACKUP_ROOT/$TIMESTAMP"

mkdir -p "$TARGET"

docker compose --project-directory "$ROOT_DIR" exec -T postgis \
  pg_dump --username bats --dbname bats --format=custom --no-owner --no-privileges \
  > "$TARGET/database.dump"

if [[ -d "$ROOT_DIR/uploads" ]]; then
  tar -C "$ROOT_DIR" -czf "$TARGET/uploads.tar.gz" uploads
fi

{
  echo "created_at=$TIMESTAMP"
  echo "database=database.dump"
  if [[ -f "$TARGET/uploads.tar.gz" ]]; then
    echo "evidence=uploads.tar.gz"
  fi
} > "$TARGET/manifest.txt"

echo "Backup BATS đã tạo tại: $TARGET"
