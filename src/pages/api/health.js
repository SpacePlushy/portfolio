// Global state for tracking initialization
let applicationReady = false;
let sharpReady = false;
let redisReady = false;
let startupTime = Date.now();

// Initialize dependencies asynchronously on startup
initializeDependencies();

export async function GET() {
  const startTime = Date.now();
  const checks = {};
  let overallStatus = 'healthy';
  const uptime = (Date.now() - startupTime) / 1000;

  try {
    // Basic application health - always healthy if we can respond
    checks.application = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      startup_time: uptime,
      memory: getMemoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      ready: applicationReady
    };

    // Environment check
    checks.environment = {
      status: 'healthy',
      node_version: process.version,
      environment: process.env.NODE_ENV || 'production',
      port: process.env.PORT || 4321,
      host: process.env.HOST || '0.0.0.0'
    };

    // Quick Sharp check (non-blocking)
    checks.sharp = getSharpStatus();

    // Quick Redis check (non-blocking)
    checks.redis = getRedisStatus();

    // File system check with timeout
    checks.filesystem = await checkFileSystemQuick();

    // For startup period, be more lenient
    if (uptime < 60) { // First 60 seconds
      // Only fail if critical errors exist
      const criticalChecks = [checks.application, checks.environment, checks.filesystem];
      if (criticalChecks.some(check => check.status === 'unhealthy')) {
        overallStatus = 'unhealthy';
      } else {
        overallStatus = 'healthy'; // Allow degraded services during startup
      }
    } else {
      // Normal health check logic after startup period
      const allChecks = Object.values(checks);
      if (allChecks.some(check => check.status === 'unhealthy')) {
        overallStatus = 'unhealthy';
      } else if (allChecks.some(check => check.status === 'degraded')) {
        overallStatus = 'degraded';
      }
    }

  } catch (error) {
    // Don't fail health check for non-critical errors during startup
    if (uptime < 60) {
      overallStatus = 'degraded';
      checks.startup_error = {
        status: 'degraded',
        message: 'Startup in progress',
        error: error.message
      };
    } else {
      overallStatus = 'unhealthy';
      checks.error = {
        status: 'unhealthy',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }
  }

  const responseTime = Date.now() - startTime;
  
  // Always return 200 during startup period for health checks
  const status = (uptime < 60 || overallStatus === 'healthy') ? 200 : 503;

  return new Response(JSON.stringify({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    response_time_ms: responseTime,
    startup_time_seconds: Math.round(uptime),
    checks
  }, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}

// Initialize dependencies asynchronously to avoid blocking health checks
async function initializeDependencies() {
  console.log('Starting dependency initialization...');
  
  // Initialize Sharp
  try {
    console.log('Initializing Sharp...');
    await initializeSharp();
    sharpReady = true;
    console.log('Sharp initialized successfully');
  } catch (error) {
    console.error('Sharp initialization failed:', error.message);
    sharpReady = false;
  }

  // Initialize Redis
  try {
    console.log('Initializing Redis connection...');
    await initializeRedis();
    redisReady = true;
    console.log('Redis initialized successfully');
  } catch (error) {
    console.error('Redis initialization failed:', error.message);
    redisReady = false;
  }

  applicationReady = true;
  console.log('Application dependencies initialized');
}

// Quick, non-blocking status checks
function getSharpStatus() {
  if (!sharpReady) {
    return {
      status: 'degraded',
      message: 'Sharp initialization in progress',
      ready: false
    };
  }
  return {
    status: 'healthy',
    message: 'Sharp image processing ready',
    ready: true
  };
}

function getRedisStatus() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return {
      status: 'degraded',
      message: 'Redis not configured',
      ready: false
    };
  }
  
  if (!redisReady) {
    return {
      status: 'degraded',
      message: 'Redis connection in progress',
      ready: false,
      url: redisUrl.replace(/:[^:]*@/, ':***@')
    };
  }
  
  return {
    status: 'healthy',
    message: 'Redis connection ready',
    ready: true,
    url: redisUrl.replace(/:[^:]*@/, ':***@')
  };
}

function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / 1024 / 1024), // MB
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
    external: Math.round(usage.external / 1024 / 1024) // MB
  };
}

async function checkFileSystemQuick() {
  // Use a timeout to prevent blocking health checks
  return Promise.race([
    checkFileSystem(),
    new Promise(resolve => 
      setTimeout(() => resolve({
        status: 'degraded',
        message: 'File system check timeout',
        timeout: true
      }), 2000) // 2-second timeout
    )
  ]);
}

async function checkFileSystem() {
  try {
    const fs = await import('fs/promises');
    await fs.access('./dist/server/entry.mjs');
    return {
      status: 'healthy',
      message: 'Application files accessible'
    };
  } catch (error) {
    // During startup, this might be expected
    return {
      status: 'degraded',
      message: 'Application files check failed',
      error: error.message
    };
  }
}

// Async Sharp initialization with proper error handling
async function initializeSharp() {
  try {
    console.log('Loading Sharp module...');
    const sharp = await import('sharp');
    
    if (!sharp.default) {
      throw new Error('Sharp module not available');
    }
    
    // Test basic Sharp functionality with timeout
    console.log('Testing Sharp functionality...');
    // Create a minimal valid PNG buffer (8x8 red square)
    const testImage = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00, 0x08,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x4B, 0x6D, 0x29,
      0xDC, 0x00, 0x00, 0x00, 0x1C, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x78, 0x9C, 0x62, 0xF8, 0xCF, 0xC0, 0x00,
      0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D,
      0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, // IEND chunk
      0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    // Use a timeout to prevent hanging
    await Promise.race([
      sharp.default(testImage, { failOnError: false }).metadata(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sharp test timeout')), 5000)
      )
    ]);
    
    console.log('Sharp test completed successfully');
    return true;
  } catch (error) {
    console.error('Sharp initialization error:', error.message);
    throw error;
  }
}

// Async Redis initialization with connection testing
async function initializeRedis() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.log('Redis URL not configured, skipping Redis initialization');
    return false;
  }
  
  try {
    console.log('Testing Redis connection...');
    
    // Import Redis client dynamically
    const redisModule = await import('redis');
    const { createClient } = redisModule;
    
    // Create test client with aggressive timeouts
    const testClient = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 3000, // 3 seconds
        commandTimeout: 2000  // 2 seconds
      },
      // Don't retry during health check
      retryDelayOnFailover: 0,
      maxRetriesPerRequest: 1
    });
    
    // Test connection with timeout
    await Promise.race([
      (async () => {
        await testClient.connect();
        await testClient.ping();
        await testClient.quit();
      })(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
      )
    ]);
    
    console.log('Redis connection test successful');
    return true;
  } catch (error) {
    console.error('Redis connection test failed:', error.message);
    // Don't throw - Redis is optional for basic functionality
    return false;
  }
}

// Add a simple readiness endpoint that's even lighter
export function readiness() {
  const uptime = (Date.now() - startupTime) / 1000;
  
  return new Response(JSON.stringify({
    ready: uptime > 5, // Ready after 5 seconds minimum
    uptime: Math.round(uptime),
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}