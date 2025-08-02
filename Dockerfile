# Production Dockerfile for Digital Ocean deployment
# Optimized for 0.5GB memory constraints and reliability

# Stage 1: Dependencies
FROM node:20-alpine AS dependencies

# Install build dependencies for native modules including canvas requirements
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    pkgconfig

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
# Configure Sharp for optimal compatibility
ENV SHARP_IGNORE_GLOBAL_LIBVIPS=1
ENV SHARP_CACHE_SIZE=50
ENV SHARP_CONCURRENCY=1
ENV npm_config_arch=x64
ENV npm_config_platform=linux

RUN npm ci --production --no-audit --no-fund

# Stage 2: Build
FROM node:20-alpine AS builder

# Install build dependencies including canvas requirements
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    pkgconfig

WORKDIR /app

# Copy production dependencies
COPY --from=dependencies /app/node_modules ./node_modules
COPY package*.json ./

# Install all dependencies for build
RUN npm ci --no-audit --no-fund

# Copy source code
COPY . .

# Build with memory constraints
ENV NODE_OPTIONS="--max-old-space-size=1536"
ENV NODE_ENV=production

RUN npm run build

# Stage 3: Production Runtime
FROM node:20-alpine AS runtime

# Install runtime dependencies including canvas runtime libraries
RUN apk add --no-cache \
    libc6-compat \
    tini \
    curl \
    cairo \
    jpeg \
    pango \
    giflib \
    pixman \
    pangomm \
    libjpeg-turbo \
    freetype

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

WORKDIR /app

# Copy production files with proper ownership
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs server.js ./

# Create cache directory for Sharp
RUN mkdir -p /app/.cache && chown -R nodejs:nodejs /app/.cache

# Set production environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080

# Memory optimization for 0.5GB instance
ENV NODE_OPTIONS="--max-old-space-size=400"

# Sharp runtime optimizations
ENV SHARP_CACHE_MEMORY=50
ENV SHARP_CACHE_FILES=20
ENV SHARP_CACHE_ITEMS=100
ENV SHARP_CONCURRENCY=1
ENV SHARP_SIMD=false

# Switch to non-root user
USER nodejs

EXPOSE 8080

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=3 \
  CMD curl -f http://localhost:8080/api/health?quick=true || exit 1

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start the optimized server
CMD ["node", "server.js"]