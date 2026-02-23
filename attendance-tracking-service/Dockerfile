# ─── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only package files first to leverage Docker layer cache
COPY package*.json ./

RUN npm ci --only=production && \
    # Prune npm cache to reduce image size
    npm cache clean --force

# ─── Stage 2: Development ─────────────────────────────────────────────────────
FROM node:20-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]

# ─── Stage 3: Production ──────────────────────────────────────────────────────
FROM node:20-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser  -S nodeuser -u 1001

WORKDIR /app

# Copy production dependencies from deps stage
COPY --from=deps --chown=nodeuser:nodejs /app/node_modules ./node_modules

# Copy source code
COPY --chown=nodeuser:nodejs . .

# Create log directory
RUN mkdir -p logs && chown nodeuser:nodejs logs

# Switch to non-root user
USER nodeuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "src/server.js"]
