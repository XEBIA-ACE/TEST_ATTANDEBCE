# ─── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only package files to leverage Docker layer caching
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# ─── Stage 2: Build (for any future transpilation/bundling) ───────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Copy source
COPY src/ ./src/

# ─── Stage 3: Production Image ────────────────────────────────────────────────
FROM node:20-alpine AS production

LABEL maintainer="your-team@example.com"
LABEL org.opencontainers.image.title="Attendance Tracking Service"
LABEL org.opencontainers.image.version="1.0.0"

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY --from=build /app/src ./src
COPY package*.json ./

# Create log directory and set permissions
RUN mkdir -p logs && chown -R appuser:appgroup /app

USER appuser

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Start the server
CMD ["node", "src/server.js"]
