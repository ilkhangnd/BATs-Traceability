#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${1:-"$ROOT_DIR/.env.staging"}"

docker compose \
  --project-name bats-staging \
  --env-file "$ENV_FILE" \
  -f "$ROOT_DIR/docker-compose.prod.yml" \
  down
