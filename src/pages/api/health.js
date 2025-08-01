export async function GET() {
  const startTime = Date.now();
  const checks = {};
  let overallStatus = 'healthy';

  try {
    // Basic application health
    checks.application = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    };

    // Environment check
    checks.environment = {
      status: 'healthy',
      node_version: process.version,
      environment: process.env.NODE_ENV || 'production',
      port: process.env.PORT || 8080
    };

    // File system check
    checks.filesystem = await checkFileSystem();

    // Determine overall status
    const allChecks = Object.values(checks);
    if (allChecks.some(check => check.status === 'unhealthy')) {
      overallStatus = 'unhealthy';
    } else if (allChecks.some(check => check.status === 'degraded')) {
      overallStatus = 'degraded';
    }

  } catch (error) {
    overallStatus = 'unhealthy';
    checks.error = {
      status: 'unhealthy',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }

  const responseTime = Date.now() - startTime;
  const status = overallStatus === 'healthy' ? 200 : 503;

  return new Response(JSON.stringify({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    response_time_ms: responseTime,
    checks
  }, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
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
    return {
      status: 'unhealthy',
      message: 'Application files not accessible',
      error: error.message
    };
  }
}