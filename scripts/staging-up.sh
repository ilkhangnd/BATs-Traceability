#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${1:-"$ROOT_DIR/.env.staging"}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Thiếu $ENV_FILE. Sao chép .env.staging.example và thay secret trước." >&2
  exit 2
fi

docker compose \
  --project-name bats-staging \
  --env-file "$ENV_FILE" \
  -f "$ROOT_DIR/docker-compose.prod.yml" \
  up -d --build postgis

docker compose \
  --project-name bats-staging \
  --env-file "$ENV_FILE" \
  -f "$ROOT_DIR/docker-compose.prod.yml" \
  build backend web

docker compose \
  --project-name bats-staging \
  --env-file "$ENV_FILE" \
  -f "$ROOT_DIR/docker-compose.prod.yml" \
  run --rm --no-deps --entrypoint bash backend -lc \
  'apps/backend/node_modules/.bin/prisma migrate deploy --schema apps/backend/prisma/schema.prisma && node apps/backend/prisma/seed.mjs'

docker compose \
  --project-name bats-staging \
  --env-file "$ENV_FILE" \
  -f "$ROOT_DIR/docker-compose.prod.yml" \
  up -d backend web

echo "BATS staging: web http://localhost:3400, API http://localhost:4400"
