# ── Stage 1: Dependencies ─────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Copy only manifests to leverage Docker layer caching
COPY package*.json ./
RUN npm ci --omit=dev

# ── Stage 2: Build / test (optional CI step) ─────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Run linting and tests during build (remove if too slow for your pipeline)
# RUN npm test

# ── Stage 3: Production image ─────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# Non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Copy production deps from deps stage
COPY --from=deps --chown=appuser:appgroup /app/node_modules ./node_modules

# Copy source
COPY --chown=appuser:appgroup . .

# Create logs directory with correct permissions
RUN mkdir -p logs && chown appuser:appgroup logs

USER appuser

EXPOSE 3000

# Health check — requires the service to expose /health
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
