#!/usr/bin/env node
/**
 * Production server startup script
 * Sets environment variables and starts the Astro server
 */

// Set port before importing the server
process.env.PORT = process.env.PORT || '8080';
process.env.HOST = process.env.HOST || '0.0.0.0';

console.log('🚀 Starting portfolio server...');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'production'}`);
console.log(`🌐 Host: ${process.env.HOST}:${process.env.PORT}`);
console.log(`💾 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB used`);

// Import and start the server
import('../dist/server/entry.mjs').catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});