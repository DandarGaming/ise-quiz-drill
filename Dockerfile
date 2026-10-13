# syntax=docker/dockerfile:1

# ---- Stage 1: build ----
FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies first so this layer is cached until the lockfile changes
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Stage 2: runtime ----
FROM node:22-alpine AS runner
WORKDIR /app

# Pick up security fixes released after the base image was built
RUN apk upgrade --no-cache

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4321

# Production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

USER node
EXPOSE 4321

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${PORT}/api/health || exit 1

CMD ["node", "./dist/server/entry.mjs"]
