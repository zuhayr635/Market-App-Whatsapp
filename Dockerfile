# ── Stage 1: Dependencies ─────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Build tools for native modules
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
# npm cache mount: tekrar build'de npm indirmez, çok hızlandırır
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --legacy-peer-deps

# ── Stage 2: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma client oluştur
RUN npx prisma generate

# Next.js build (dummy DATABASE_URL for build-time Prisma client init)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL="mysql://root:build@localhost:3306/market_db"
RUN npm run build

# ── Stage 3: Runner (minimal imaj) ────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN apk add --no-cache curl
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p public/uploads && \
    chown nextjs:nodejs public/uploads

# Standalone output + static assets
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma CLI + client + migration deps
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/effect ./node_modules/effect
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin ./node_modules/.bin
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs
EXPOSE 3000

# Startup script: migrate → seed → server
COPY --from=builder --chown=nextjs:nodejs /app/prisma/docker-seed.js ./prisma/docker-seed.js
CMD ["sh", "-c", "echo '=== Running migrations ===' && node node_modules/prisma/build/index.js migrate deploy 2>&1 || echo 'Migration failed (may be first run)'; echo '=== Running seed ===' && node prisma/docker-seed.js 2>&1 || echo 'Seed skipped'; echo '=== Starting server ===' && exec node server.js"]
