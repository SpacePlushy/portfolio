# Digital Ocean Deployment Troubleshooting

This document provides troubleshooting steps for resolving health check failures and deployment issues on Digital Ocean App Platform.

## Current Issue: Health Check Failures

### Symptoms
- Build phase completes successfully
- Deployment fails during "wait" phase with "DeployContainerHealthChecksFailed"
- Container doesn't respond to health checks within timeout period

### Root Causes Identified

1. **Sharp Initialization Delay**: Sharp native bindings take time to initialize in containerized environments
2. **Redis Connection Blocking**: Redis connection attempts can timeout during health checks
3. **Health Check Timing**: Original 30-second initial delay insufficient for full application startup
4. **Synchronous Dependency Loading**: Health checks were blocking on slow dependency initialization

## Fixes Implemented

### 1. Improved Health Check Endpoint (`/src/pages/api/health.js`)

**Changes:**
- Asynchronous dependency initialization on startup
- Non-blocking status checks during health check requests
- Lenient health checks during startup period (first 60 seconds)
- Proper timeout handling for file system and Sharp checks
- Always return 200 status during startup period

**Key Improvements:**
```javascript
// Global state tracking
let applicationReady = false;
let sharpReady = false;
let redisReady = false;

// Non-blocking initialization
initializeDependencies(); // Runs in background

// Lenient startup period logic
if (uptime < 60) {
  // Only fail on critical errors during startup
  overallStatus = 'healthy'; // Allow degraded services
}
```

### 2. New Readiness Endpoint (`/src/pages/api/readiness.js`)

**Purpose:**
- Ultra-lightweight health check that always responds quickly
- Used as fallback in Docker health checks
- Minimal dependencies, just verifies server can respond

### 3. Updated Digital Ocean Configuration (`.do/app.yaml`)

**Changes:**
```yaml
health_check:
  http_path: /api/health
  initial_delay_seconds: 45  # Increased from 30
  period_seconds: 20         # Increased from 15
  timeout_seconds: 15        # Increased from 10
  success_threshold: 1       # Unchanged
  failure_threshold: 5       # Increased from 3
```

### 4. Enhanced Docker Configuration

**Changes:**
- Increased Docker health check start period to 60 seconds
- Added fallback to readiness endpoint
- Improved health check command:
```dockerfile
HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=5 \
    CMD curl -f http://localhost:4321/api/readiness || curl -f http://localhost:4321/api/health || exit 1
```

### 5. Startup Script (`/scripts/start-server.js`)

**Features:**
- Pre-flight checks before starting server
- Proper error handling and logging
- Graceful shutdown handling
- Process title setting for easier identification
- Startup timeout monitoring

### 6. Middleware Optimization

**Changes:**
- Skip heavy processing for health check endpoints
- Reduced startup overhead
- Faster response times during initialization

## Testing the Fixes

### Local Testing

1. **Build and run locally:**
```bash
npm run build
npm run preview
```

2. **Test health endpoints:**
```bash
# Quick readiness check
curl http://localhost:4321/api/readiness

# Full health check
curl http://localhost:4321/api/health
```

3. **Use monitoring script:**
```bash
node scripts/deployment-monitor.js --host localhost --port 4321
```

### Docker Testing

1. **Build Docker image:**
```bash
docker build -t portfolio-test .
```

2. **Run container:**
```bash
docker run -p 4321:4321 -e NODE_ENV=production portfolio-test
```

3. **Monitor Docker health:**
```bash
docker ps # Check health status
docker logs <container-id> # Check startup logs
```

## Deployment Process

### 1. Pre-deployment Checklist

- [ ] All fixes implemented and tested locally
- [ ] Docker image builds successfully
- [ ] Health endpoints respond within 15 seconds
- [ ] Sharp initialization completes within 45 seconds
- [ ] Redis connection (if configured) doesn't block startup

### 2. Deploy to Digital Ocean

```bash
# Push to repository (triggers auto-deployment)
git push origin build-fixes
```

### 3. Monitor Deployment

1. **Check Digital Ocean console:**
   - Build logs for any compilation errors
   - Runtime logs for startup messages
   - Health check status

2. **Use monitoring script against live URL:**
```bash
node scripts/deployment-monitor.js --host your-app.ondigitalocean.app --protocol https
```

## Troubleshooting Common Issues

### Issue: Health Check Still Failing

**Debug Steps:**
1. Check Digital Ocean runtime logs for startup messages
2. Verify Sharp initialization logs: "Sharp initialized successfully"
3. Check Redis connection logs: "Redis initialized successfully"
4. Look for timeout errors in health check responses

**Solutions:**
- Increase `initial_delay_seconds` further if needed
- Check if Redis URL is causing connection delays
- Verify container has sufficient memory (basic-s = 1GB)

### Issue: Redis Connection Timeout

**Debug Steps:**
1. Check if REDIS_URL environment variable is set correctly
2. Verify Redis database is accessible from Digital Ocean
3. Check Redis connection timeout in health check logs

**Solutions:**
- Ensure Redis is in same region as app
- Verify Redis credentials and URL format
- Consider making Redis optional for core functionality

### Issue: Sharp Initialization Timeout

**Debug Steps:**
1. Check memory usage during Sharp initialization
2. Look for Sharp-specific error messages
3. Verify native dependencies are built correctly

**Solutions:**
- Increase container memory if using basic-xxs
- Check Sharp environment variables in Docker
- Verify libvips installation in container

### Issue: Container Memory Issues

**Debug Steps:**
1. Monitor memory usage in health check responses
2. Check for out-of-memory kills in Digital Ocean logs
3. Verify Node.js memory settings

**Solutions:**
- Increase instance size from basic-xxs to basic-s
- Adjust NODE_OPTIONS max-old-space-size
- Optimize Sharp concurrency settings

## Monitoring and Alerts

### Health Check Monitoring

Use the deployment monitor script for continuous monitoring:

```bash
# One-time check
node scripts/deployment-monitor.js --host your-app.ondigitalocean.app --protocol https

# Continuous monitoring (with external tool)
while true; do
  node scripts/deployment-monitor.js --host your-app.ondigitalocean.app --protocol https
  sleep 30
done
```

### Key Metrics to Monitor

1. **Startup Time**: Should be < 45 seconds
2. **Health Check Response Time**: Should be < 10 seconds
3. **Memory Usage**: RSS should be < 800MB on basic-s
4. **Sharp Initialization**: Should complete within 30 seconds
5. **Redis Connection**: Should establish within 5 seconds

## Recovery Procedures

### If Deployment Fails

1. **Check build logs** in Digital Ocean console
2. **Review runtime logs** for startup errors
3. **Test health endpoints** manually if container starts
4. **Rollback** to previous working version if needed
5. **Increase timeouts** temporarily if initialization is slow

### Emergency Rollback

```bash
# Revert to last known good commit
git revert HEAD
git push origin build-fixes

# Or deploy from specific commit
git checkout <good-commit-hash>
git push -f origin build-fixes
```

## Performance Optimizations

### Container Optimizations

1. **Multi-stage Docker build** reduces image size
2. **Non-root user** improves security
3. **Tini process manager** handles signals properly
4. **Sharp environment variables** optimize image processing

### Application Optimizations

1. **Asynchronous initialization** prevents blocking
2. **Timeout handling** prevents hanging requests
3. **Graceful degradation** during startup
4. **Memory-optimized** Sharp configuration

## Contact and Support

For issues not covered in this guide:

1. Check Digital Ocean App Platform documentation
2. Review Docker and Node.js logs carefully  
3. Test fixes locally before deploying
4. Monitor memory and CPU usage patterns
5. Consider scaling up instance size if resource-constrained

---

**Last Updated**: August 1, 2025
**Version**: 1.0
**Status**: Active Fixes Implemented