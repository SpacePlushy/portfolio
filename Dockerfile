# Production-ready Dockerfile for Digital Ocean deployment
# Optimized for Sharp compatibility and build reliability

# Stage 1: Dependencies and Sharp compilation
FROM node:20-alpine AS dependencies

# Install system dependencies for Sharp and native modules
RUN apk add --no-cache \
    build-base \
    vips-dev \
    python3 \
    make \
    g++ \
    libc6-compat \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Set build environment
ENV NODE_ENV=production
ENV SHARP_IGNORE_GLOBAL_LIBVIPS=1
ENV SHARP_CACHE_SIZE=50
ENV SHARP_CONCURRENCY=1

# Install dependencies with proper Sharp compilation
RUN npm ci --production --no-audit --no-fund

# Stage 2: Build application
FROM node:20-alpine AS builder

# Install build dependencies including make for canvas
RUN apk add --no-cache \
    vips-dev \
    libc6-compat \
    build-base \
    python3 \
    make \
    g++ \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/package*.json ./

# Install dev dependencies for build
RUN npm ci --include=dev --no-audit --no-fund

# Copy source code
COPY . .

# Build with memory optimizations
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV NODE_ENV=production

RUN npm run build

# Stage 3: Production runtime
FROM node:20-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    vips \
    libc6-compat \
    tini \
    curl \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S astro && \
    adduser -S astro -u 1001 -G astro

WORKDIR /app

# Copy production dependencies
COPY --from=dependencies --chown=astro:astro /app/node_modules ./node_modules
COPY --from=dependencies --chown=astro:astro /app/package*.json ./

# Copy built application
COPY --from=builder --chown=astro:astro /app/dist ./dist

# Create cache directories
RUN mkdir -p .cache/images tmp && \
    chown -R astro:astro .cache tmp

# Set production environment
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=1536"
ENV PORT=4321
ENV HOST=0.0.0.0

# Sharp optimizations for Digital Ocean
ENV SHARP_CACHE_SIZE=100
ENV SHARP_CONCURRENCY=2
ENV SHARP_SIMD=true

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:4321/api/health || exit 1

# Switch to non-root user
USER astro

# Expose port
EXPOSE 4321

# Use tini for proper signal handling
ENTRYPOINT ["tini", "--"]

# Start application
CMD ["node", "./dist/server/entry.mjs"]