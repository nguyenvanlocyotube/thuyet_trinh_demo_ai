# ==============================================================================
# Multi-Stage Dockerfile for TanStack Start SSR on Google Cloud Run
# Optimized for security, small image footprint, and high-performance Nitro/srvx
# ==============================================================================

# Stage 1: Build application assets
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat

# Copy package manifests
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies needed for vite build)
RUN npm ci

# Copy project source files
COPY tsconfig.json vite.config.ts index.html ./
COPY public ./public
COPY src ./src
COPY data ./data

# Build production client and server bundles
RUN npm run build

# Stage 2: Production runtime environment
FROM node:22-alpine AS runner

WORKDIR /app

# Cloud Run injects PORT environment variable (default: 8080)
ENV NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0

# Create non-root user for enterprise container security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Copy package manifests and install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy built bundles and static files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/data ./data

# Ensure data directory has write permissions for non-root user (JSON persistence)
RUN chown -R appuser:nodejs /app

# Switch to non-root user
USER appuser

# Cloud Run listens on PORT 8080
EXPOSE 8080

# Health check to ensure Cloud Run container liveness
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${PORT}/ || exit 1

# Start srvx production server
CMD ["npm", "run", "start"]
