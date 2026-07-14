# syntax=docker/dockerfile:1.7
FROM node:22-bookworm-slim AS dependencies
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@11.7.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/blockchain/package.json apps/blockchain/package.json
COPY apps/zalo-mini-app/package.json apps/zalo-mini-app/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN --mount=type=cache,id=bats-pnpm-store,target=/pnpm/store \
  pnpm config set store-dir /pnpm/store \
  && pnpm config set fetch-retries 5 \
  && pnpm config set fetch-retry-maxtimeout 120000 \
  && pnpm config set fetch-timeout 300000 \
  && pnpm install --frozen-lockfile \
    --filter @bats/backend... \
    --filter @bats/web... \
    --filter @bats/shared-types...

FROM dependencies AS backend-build
COPY . .
RUN pnpm --filter @bats/shared-types build
RUN pnpm --filter @bats/backend db:generate
RUN pnpm --filter @bats/backend build

FROM node:22-bookworm-slim AS backend
ENV NODE_ENV=production
ENV API_PORT=4000
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=backend-build /app /app
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads
USER node
EXPOSE 4000
CMD ["bash", "scripts/backend-entrypoint.sh"]

FROM dependencies AS web-build
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
ARG NEXT_PUBLIC_GOOGLE_MAP_ID=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ENV NEXT_PUBLIC_GOOGLE_MAP_ID=$NEXT_PUBLIC_GOOGLE_MAP_ID
COPY . .
RUN pnpm --filter @bats/web build

FROM node:22-bookworm-slim AS web
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app
COPY --from=web-build /app/apps/web/.next/standalone ./
COPY --from=web-build /app/apps/web/.next/static ./apps/web/.next/static
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
