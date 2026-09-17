# Use Docker's bundled BuildKit frontend; no external frontend image required.
FROM node:22-alpine AS base

WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

# ==============================================================================
# Stage 1: Shared Dependencies (Runs ONLY ONCE with BuildKit cache mount)
# ==============================================================================
FROM base AS deps

COPY package.json package-lock.json turbo.json tsconfig.json ./
COPY packages/types/package.json ./packages/types/
COPY packages/database/package.json ./packages/database/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Fast npm install with BuildKit cache mount and no audit/fund overhead
RUN --mount=type=cache,target=/root/.npm \
    npm ci --include=dev --prefer-offline --no-audit --no-fund

# ==============================================================================
# Stage 2: Shared Builder (Prisma Client & Monorepo Packages built ONCE)
# ==============================================================================
FROM deps AS shared-builder

# Preserve root and workspace-local node_modules (including the Nest CLI).
COPY packages/ ./packages/

# Generate Prisma client & build types + database
RUN npm run db:generate --workspace=@truyenkomi/database && \
    npm run build --workspace=@truyenkomi/types && \
    npm run build --workspace=@truyenkomi/database

# ==============================================================================
# Target Stage: NestJS REST API (api)
# ==============================================================================
FROM shared-builder AS api-builder

COPY apps/api/ ./apps/api/
RUN npm run build --workspace=@truyenkomi/api

FROM node:22-alpine AS api
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --from=api-builder /app/package.json /app/package-lock.json ./
COPY --from=api-builder /app/node_modules ./node_modules
COPY --from=api-builder /app/packages ./packages
COPY --from=api-builder /app/apps/api ./apps/api

USER nestjs
EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]

# ==============================================================================
# Target Stage: Next.js 15 Standalone Web (web)
# ==============================================================================
FROM shared-builder AS web-builder

ENV NEXT_TELEMETRY_DISABLED=1
COPY apps/web/ ./apps/web/
RUN npm run build --workspace=@truyenkomi/web

FROM node:22-alpine AS web
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=web-builder /app/apps/web/public ./apps/web/public
COPY --from=web-builder /app/apps/web/.next/standalone ./
COPY --from=web-builder /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]

# ==============================================================================
# Target Stage: MangaDex Crawler Daemon (crawler)
# ==============================================================================
FROM shared-builder AS crawler-builder

COPY apps/ ./apps/
COPY scripts/ ./scripts/

FROM node:22-alpine AS crawler
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 crawler

COPY --from=crawler-builder /app/package.json /app/package-lock.json /app/tsconfig.json ./
COPY --from=crawler-builder /app/node_modules ./node_modules
COPY --from=crawler-builder /app/packages ./packages
COPY --from=crawler-builder /app/apps ./apps
COPY --from=crawler-builder /app/scripts ./scripts

USER crawler
CMD ["npx", "tsx", "scripts/crawl-mangadex.ts", "--continuous", "--interval=10", "--mode=hybrid"]
