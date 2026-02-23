# ─── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy manifests first so Docker can cache the install layer
COPY package*.json ./
RUN npm ci --omit=dev

# ─── Stage 2: Production image ──────────────────────────────────────────────────
FROM node:20-alpine AS production

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy pruned node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY src/ ./src/
COPY knexfile.js .
COPY package.json .

# Create log directory and set ownership
RUN mkdir -p logs && chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

# Health check — pings the /health endpoint every 30 s
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/app.js"]
