/**
 * Production server for Digital Ocean deployment
 * Optimized for reliability and performance
 */

import { createServer } from 'http';
import { handler } from './dist/server/entry.mjs';

// Configuration
const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';
const SHUTDOWN_TIMEOUT = parseInt(process.env.SHUTDOWN_TIMEOUT || '15000', 10);
const SERVER_READY_DELAY = parseInt(process.env.SERVER_READY_DELAY || '3000', 10);

// Server state
const serverState = {
  ready: false,
  shuttingDown: false,
  startTime: Date.now()
};

// Validate handler
if (!handler || typeof handler !== 'function') {
  console.error('ERROR: Handler not found. Run "npm run build" first.');
  process.exit(1);
}

console.log(`Starting server on ${HOST}:${PORT}...`);

// Create HTTP server
const server = createServer((req, res) => {
  // Handle health checks during startup
  if (!serverState.ready && req.url === '/api/health' && req.url.includes('quick=true')) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('STARTING');
    return;
  }
  
  // Handle shutdown gracefully
  if (serverState.shuttingDown) {
    res.writeHead(503, { 
      'Content-Type': 'text/plain',
      'Connection': 'close'
    });
    res.end('SERVER_SHUTTING_DOWN');
    return;
  }
  
  // Delegate to Astro handler
  handler(req, res);
});

// Configure server timeouts
server.timeout = 60000; // 60 seconds
server.headersTimeout = 65000; // Slightly higher than timeout
server.keepAliveTimeout = 5000; // 5 seconds
server.requestTimeout = 60000; // 60 seconds

// Graceful shutdown handler
function gracefulShutdown(signal) {
  if (serverState.shuttingDown) {
    console.log('Shutdown already in progress');
    return;
  }
  
  console.log(`${signal} received. Starting graceful shutdown...`);
  serverState.shuttingDown = true;
  
  // Stop accepting new connections
  server.close(() => {
    console.log('Server closed successfully');
    process.exit(0);
  });
  
  // Force shutdown after timeout
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);
}

// Register signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Log but don't exit in production
  if (process.env.NODE_ENV !== 'production') {
    gracefulShutdown('UNHANDLED_REJECTION');
  }
});

// Start server
server.listen(PORT, HOST, () => {
  console.log(`Server listening at http://${HOST}:${PORT}`);
  console.log('Environment:', process.env.NODE_ENV || 'production');
  console.log('Health check endpoint: /api/health');
  console.log('Quick health check: /api/health?quick=true');
  console.log('Verbose health check: /api/health?verbose=true');
  
  // Mark server as ready after delay
  setTimeout(() => {
    serverState.ready = true;
    const startupTime = Date.now() - serverState.startTime;
    console.log(`Server ready for traffic (startup time: ${startupTime}ms)`);
  }, SERVER_READY_DELAY);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
  
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  } else if (error.code === 'EACCES') {
    console.error(`Permission denied to bind to port ${PORT}`);
  }
  
  process.exit(1);
});

// Log memory usage periodically in development
if (process.env.NODE_ENV !== 'production') {
  setInterval(() => {
    const usage = process.memoryUsage();
    console.log('Memory:', {
      rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
      heap: `${Math.round(usage.heapUsed / 1024 / 1024)}/${Math.round(usage.heapTotal / 1024 / 1024)}MB`
    });
  }, 30000);
}