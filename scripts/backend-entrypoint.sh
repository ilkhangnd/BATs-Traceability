#!/usr/bin/env bash
set -euo pipefail

apps/backend/node_modules/.bin/prisma migrate deploy \
  --schema apps/backend/prisma/schema.prisma

exec node apps/backend/dist/main.js
