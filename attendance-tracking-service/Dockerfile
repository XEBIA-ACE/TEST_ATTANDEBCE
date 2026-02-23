# ─── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only dependency manifests to leverage layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# ─── Stage 2: Builder (dev deps for any transpilation/asset steps) ────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# If you add a build step (TypeScript, etc.), run it here:
# RUN npm run build

# ─── Stage 3: Production image ────────────────────────────────────────────────
FROM node:20-alpine AS production

# Security: run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser  -S nodeapp -u 1001 -G nodejs

WORKDIR /app

# Copy production node_modules from deps stage
COPY --from=deps --chown=nodeapp:nodejs /app/node_modules ./node_modules

# Copy application source (only what's needed at runtime)
COPY --chown=nodeapp:nodejs src/         ./src/
COPY --chown=nodeapp:nodejs migrations/  ./migrations/
COPY --chown=nodeapp:nodejs knexfile.js  ./
COPY --chown=nodeapp:nodejs package.json ./

# Create writable directories for logs and SQLite data
RUN mkdir -p /app/logs /app/data && \
    chown -R nodeapp:nodejs /app/logs /app/data

USER nodeapp

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/v1/health || exit 1

CMD ["node", "src/app.js"]
