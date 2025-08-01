#!/usr/bin/env node
/**
 * Production server startup script with proper initialization
 * Handles graceful startup, dependency checks, and error handling
 */

import path from 'path';
import { spawn } from 'child_process';

// Configuration
const SERVER_PATH = './dist/server/entry.mjs';
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const STARTUP_TIMEOUT = 60000; // 60 seconds

console.log('🚀 Starting portfolio server...');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'production'}`);
console.log(`🌐 Host: ${HOST}:${PORT}`);
console.log(`📁 Server: ${SERVER_PATH}`);
console.log(`💾 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB used`);

// Pre-flight checks
async function preflightChecks() {
  console.log('🔍 Running pre-flight checks...');
  
  // Check if server file exists
  try {
    const fs = await import('fs');
    if (!fs.existsSync(SERVER_PATH)) {
      throw new Error(`Server entry point not found: ${SERVER_PATH}`);
    }
    console.log('✅ Server entry point found');
  } catch (error) {
    console.error('❌ Pre-flight check failed:', error.message);
    process.exit(1);
  }

  // Check environment variables
  const requiredEnvVars = ['NODE_ENV'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn('⚠️  Missing environment variables:', missingVars.join(', '));
  }

  // Check optional environment variables
  if (process.env.REDIS_URL) {
    console.log('✅ Redis URL configured');
  } else {
    console.log('ℹ️  Redis URL not configured (optional)');
  }

  console.log('✅ Pre-flight checks completed');
}

// Start the server with proper error handling
async function startServer() {
  try {
    await preflightChecks();
    
    console.log('🚀 Starting Node.js server...');
    
    // Set process title for easier identification
    process.title = 'portfolio-server';
    
    // Start the server process
    // Override the port since Astro hardcodes it during build
    const serverProcess = spawn('node', [
      '-e',
      `process.env.PORT = '${PORT}'; process.env.HOST = '${HOST}'; import('${SERVER_PATH}');`
    ], {
      stdio: 'inherit',
      env: {
        ...process.env,
        PORT: PORT.toString(),
        HOST: HOST,
      }
    });

    // Handle server process events
    serverProcess.on('spawn', () => {
      console.log('✅ Server process started successfully');
      console.log(`🌐 Server should be available at http://${HOST}:${PORT}`);
      console.log('📡 Health check available at /api/health');
      console.log('🔄 Readiness check available at /api/readiness');
    });

    serverProcess.on('error', (error) => {
      console.error('❌ Server process error:', error);
      process.exit(1);
    });

    serverProcess.on('exit', (code, signal) => {
      if (code === 0) {
        console.log('✅ Server exited normally');
      } else {
        console.error(`❌ Server exited with code ${code} (signal: ${signal})`);
        process.exit(code);
      }
    });

    // Handle graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n📞 Received ${signal}, initiating graceful shutdown...`);
      
      // Kill the server process
      if (serverProcess && !serverProcess.killed) {
        serverProcess.kill('SIGTERM');
        
        // Force kill after timeout
        setTimeout(() => {
          if (!serverProcess.killed) {
            console.log('⚡ Force killing server process...');
            serverProcess.kill('SIGKILL');
          }
        }, 5000);
      }
    };

    // Listen for shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

    // Startup timeout
    const startupTimer = setTimeout(() => {
      console.warn('⏰ Server startup timeout reached');
      // Don't kill the process - let health checks handle it
    }, STARTUP_TIMEOUT);

    // Clear timeout when server starts responding
    // This would be cleared by a successful health check externally
    serverProcess.on('spawn', () => {
      setTimeout(() => {
        clearTimeout(startupTimer);
      }, 5000); // Clear after 5 seconds to allow initial startup
    });

  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer().catch((error) => {
  console.error('💥 Startup failed:', error);
  process.exit(1);
});