# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Dependencies
# Install ALL deps (including devDeps needed for potential build steps).
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy manifests first to leverage layer caching
COPY package*.json ./

# Install production + dev deps so we can prune later
RUN npm ci --frozen-lockfile

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Production image
# Copies only the production node_modules and source code.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS production

# Install dumb-init for proper PID 1 signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S appuser -u 1001 -G nodejs

# Copy production dependencies from deps stage
COPY --from=deps --chown=appuser:nodejs /app/node_modules ./node_modules

# Copy application source
COPY --chown=appuser:nodejs src/ ./src/
COPY --chown=appuser:nodejs package*.json ./

# Create the logs directory and assign ownership
RUN mkdir -p logs && chown appuser:nodejs logs

USER appuser

EXPOSE 3000

# Health-check for orchestrators (Docker, Kubernetes)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Use dumb-init to handle OS signals correctly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
