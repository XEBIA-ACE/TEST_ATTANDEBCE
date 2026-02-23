# ─── Stage 1: Install dependencies ───────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy dependency manifests only (for layer caching)
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# ─── Stage 2: Build / Prepare (no transpile step needed for plain JS) ─────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
# Install all deps including dev for any future build steps
RUN npm ci

COPY . .

# ─── Stage 3: Production image ────────────────────────────────────────────────
FROM node:20-alpine AS production

# Install dumb-init for proper PID 1 handling and signal forwarding
RUN apk add --no-cache dumb-init

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Copy production node_modules from deps stage
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application source
COPY --chown=nodejs:nodejs . .

# Remove dev-only files from the image
RUN rm -f .env* && rm -rf tests/

# Switch to non-root user
USER nodejs

EXPOSE 3000

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
