/**
 * Unified health check endpoint for Digital Ocean deployment
 * Provides configurable verbosity levels and graceful startup handling
 */

import { getSharpStatus, prewarmSharp } from '../../utils/sharp-loader.js';
import { createClient } from 'redis';

// Global state for tracking initialization
const appState = {
  startupTime: Date.now(),
  initialized: false,
  services: {
    sharp: { status: 'initializing', message: 'Not initialized' },
    redis: { status: 'initializing', message: 'Not initialized' },
    application: { status: 'starting', message: 'Application starting' }
  }
};

// Start background initialization
initializeServices();

export async function GET({ url }) {
  const query = new URL(url).searchParams;
  const verbose = query.get('verbose') === 'true';
  const quick = query.get('quick') === 'true';
  
  const startTime = Date.now();
  const uptime = (Date.now() - appState.startupTime) / 1000;
  
  // Quick response mode for load balancers
  if (quick) {
    return new Response('OK', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
        'X-Uptime': Math.round(uptime).toString()
      }
    });
  }
  
  // Build health response
  const health = {
    status: determineOverallStatus(),
    timestamp: new Date().toISOString(),
    uptime: Math.round(uptime),
    ready: appState.initialized
  };
  
  // Add verbose details if requested
  if (verbose) {
    health.services = { ...appState.services };
    health.memory = getMemoryInfo();
    health.environment = {
      node_version: process.version,
      port: process.env.PORT || 8080,
      environment: process.env.NODE_ENV || 'production'
    };
    health.response_time_ms = Date.now() - startTime;
  }
  
  const httpStatus = health.status === 'healthy' || uptime < 30 ? 200 : 503;
  
  return new Response(JSON.stringify(health, null, 2), {
    status: httpStatus,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Health-Status': health.status
    }
  });
}

/**
 * Initialize services in background without blocking health checks
 */
async function initializeServices() {
  console.log('[Health] Starting service initialization...');
  
  // Mark application as ready after basic startup
  setTimeout(() => {
    appState.services.application = {
      status: 'healthy',
      message: 'Application ready',
      uptime: process.uptime()
    };
    updateInitializedState();
  }, 3000);
  
  // Initialize Sharp
  setTimeout(async () => {
    try {
      await prewarmSharp();
      appState.services.sharp = getSharpStatus();
      console.log('[Health] Sharp initialized successfully');
    } catch (error) {
      appState.services.sharp = {
        status: 'degraded',
        message: 'Sharp initialization failed',
        error: error.message
      };
      console.error('[Health] Sharp initialization error:', error.message);
    }
    updateInitializedState();
  }, 5000);
  
  // Initialize Redis if configured
  if (process.env.REDIS_URL) {
    setTimeout(async () => {
      await checkRedisConnection();
      updateInitializedState();
    }, 7000);
  } else {
    appState.services.redis = {
      status: 'disabled',
      message: 'Redis not configured'
    };
  }
}

/**
 * Check Redis connection
 */
async function checkRedisConnection() {
  try {
    const client = createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 2000,
        commandTimeout: 1000
      }
    });
    
    await client.connect();
    await client.ping();
    await client.quit();
    
    appState.services.redis = {
      status: 'healthy',
      message: 'Redis connection established'
    };
    console.log('[Health] Redis connection verified');
  } catch (error) {
    appState.services.redis = {
      status: 'degraded',
      message: 'Redis connection failed',
      error: error.message
    };
    console.error('[Health] Redis check failed:', error.message);
  }
}

/**
 * Update overall initialization state
 */
function updateInitializedState() {
  const criticalServices = ['application'];
  const allHealthy = criticalServices.every(
    service => appState.services[service]?.status === 'healthy'
  );
  
  if (allHealthy && !appState.initialized) {
    appState.initialized = true;
    console.log('[Health] Application fully initialized');
  }
}

/**
 * Determine overall health status
 */
function determineOverallStatus() {
  const statuses = Object.values(appState.services).map(s => s.status);
  
  if (statuses.includes('unhealthy')) {
    return 'unhealthy';
  }
  
  // During startup, be lenient
  const uptime = (Date.now() - appState.startupTime) / 1000;
  if (uptime < 30) {
    return appState.services.application.status === 'healthy' ? 'healthy' : 'starting';
  }
  
  if (statuses.includes('degraded') || statuses.includes('initializing')) {
    return 'degraded';
  }
  
  return 'healthy';
}

/**
 * Get memory information
 */
function getMemoryInfo() {
  const usage = process.memoryUsage();
  return {
    rss_mb: Math.round(usage.rss / 1024 / 1024),
    heap_used_mb: Math.round(usage.heapUsed / 1024 / 1024),
    heap_total_mb: Math.round(usage.heapTotal / 1024 / 1024),
    external_mb: Math.round(usage.external / 1024 / 1024),
    heap_percent: Math.round((usage.heapUsed / usage.heapTotal) * 100)
  };
}