# ─── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only package files first for better layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force


# ─── Stage 2: Build / Test (CI only) ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

# Full install including devDependencies for tests/linting
RUN npm ci && npm cache clean --force

COPY . .

# Verify no lint errors in CI
# RUN npm run lint


# ─── Stage 3: Production runtime ─────────────────────────────────────────────
FROM node:20-alpine AS production

# Security: run as non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser  -u 1001 -S appuser -G appgroup

WORKDIR /app

# Copy production deps from the deps stage (no devDependencies)
COPY --from=deps --chown=appuser:appgroup /app/node_modules ./node_modules

# Copy application source
COPY --chown=appuser:appgroup src/ ./src/
COPY --chown=appuser:appgroup package*.json ./

# Create logs directory with correct ownership
RUN mkdir -p logs && chown appuser:appgroup logs

USER appuser

# Expose the application port
EXPOSE 3000

# Health check: docker can restart the container if the service is unhealthy
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Use exec form for proper signal handling (enables graceful shutdown)
CMD ["node", "src/server.js"]
