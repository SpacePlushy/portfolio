#!/usr/bin/env node
/**
 * Deployment monitoring script for Digital Ocean
 * Helps diagnose health check failures and startup issues
 */

import http from 'http';
import https from 'https';

const config = {
  host: process.env.HOST || 'localhost',
  port: process.env.PORT || 4321,
  protocol: process.env.PROTOCOL || 'http',
  endpoints: [
    '/api/readiness',
    '/api/health',
    '/',
  ],
  timeout: 15000,
  retries: 3,
  interval: 5000
};

console.log('🔍 Deployment Monitor Starting...');
console.log(`🌐 Target: ${config.protocol}://${config.host}:${config.port}`);
console.log(`⏱️  Timeout: ${config.timeout}ms`);
console.log(`🔄 Retries: ${config.retries}`);
console.log(`⏰ Interval: ${config.interval}ms`);

function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `${config.protocol}://${config.host}:${config.port}${endpoint}`;
    const client = config.protocol === 'https' ? https : http;
    
    const startTime = Date.now();
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const duration = Date.now() - startTime;
        
        let parsedData;
        try {
          parsedData = JSON.parse(data);
        } catch (e) {
          parsedData = { raw: data };
        }
        
        resolve({
          endpoint,
          status: res.statusCode,
          duration,
          headers: res.headers,
          data: parsedData
        });
      });
    });
    
    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      reject({
        endpoint,
        error: error.message,
        duration,
        code: error.code
      });
    });
    
    req.setTimeout(config.timeout, () => {
      req.destroy();
      const duration = Date.now() - startTime;
      reject({
        endpoint,
        error: 'Request timeout',
        duration,
        code: 'TIMEOUT'
      });
    });
  });
}

async function checkEndpoint(endpoint, attempt = 1) {
  console.log(`\n📍 Checking ${endpoint} (attempt ${attempt}/${config.retries + 1})`);
  
  try {
    const result = await makeRequest(endpoint);
    
    const statusIcon = result.status < 300 ? '✅' : result.status < 400 ? '⚠️' : '❌';
    console.log(`${statusIcon} ${endpoint}: ${result.status} (${result.duration}ms)`);
    
    if (result.data && typeof result.data === 'object') {
      if (result.data.status) {
        console.log(`   Status: ${result.data.status}`);
      }
      if (result.data.startup_time_seconds !== undefined) {
        console.log(`   Startup time: ${result.data.startup_time_seconds}s`);
      }
      if (result.data.checks) {
        const checks = result.data.checks;
        Object.keys(checks).forEach(checkName => {
          const check = checks[checkName];
          const icon = check.status === 'healthy' ? '✅' : check.status === 'degraded' ? '⚠️' : '❌';
          console.log(`   ${icon} ${checkName}: ${check.status} - ${check.message || 'OK'}`);
        });
      }
      if (result.data.memory) {
        const mem = result.data.memory;
        console.log(`   Memory: ${mem.heapUsed}MB heap, ${mem.rss}MB RSS`);
      }
    }
    
    return result;
  } catch (error) {
    const errorIcon = error.code === 'ECONNREFUSED' ? '🚫' : error.code === 'TIMEOUT' ? '⏰' : '❌';
    console.log(`${errorIcon} ${endpoint}: ${error.error} (${error.duration}ms)`);
    
    if (attempt <= config.retries) {
      console.log(`   Retrying in ${config.interval}ms...`);
      await new Promise(resolve => setTimeout(resolve, config.interval));
      return checkEndpoint(endpoint, attempt + 1);
    }
    
    throw error;
  }
}

async function runMonitoring() {
  const startTime = Date.now();
  console.log(`\n🚀 Starting health check monitoring at ${new Date().toISOString()}`);
  
  const results = [];
  
  for (const endpoint of config.endpoints) {
    try {
      const result = await checkEndpoint(endpoint);
      results.push({ ...result, success: true });
    } catch (error) {
      results.push({ ...error, success: false });
    }
  }
  
  const totalTime = Date.now() - startTime;
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;
  
  console.log(`\n📊 Summary (${totalTime}ms total):`);
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  if (failed > 0) {
    console.log('\n🔍 Failed endpoints:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`   ${result.endpoint}: ${result.error} (${result.code})`);
    });
  }
  
  // Overall health assessment
  const healthyEndpoints = results.filter(r => r.success && r.status && r.status < 300).length;
  const overallHealth = healthyEndpoints === results.length ? 'HEALTHY' : 
                       healthyEndpoints > 0 ? 'DEGRADED' : 'UNHEALTHY';
  
  const healthIcon = overallHealth === 'HEALTHY' ? '✅' : 
                    overallHealth === 'DEGRADED' ? '⚠️' : '❌';
  
  console.log(`\n${healthIcon} Overall Status: ${overallHealth}`);
  
  // Exit code for monitoring systems
  process.exit(overallHealth === 'HEALTHY' ? 0 : 1);
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node deployment-monitor.js [options]

Options:
  --host <host>       Target host (default: localhost)
  --port <port>       Target port (default: 4321)
  --protocol <proto>  Protocol http/https (default: http)
  --timeout <ms>      Request timeout (default: 15000)
  --retries <n>       Number of retries (default: 3)
  --interval <ms>     Retry interval (default: 5000)
  --help, -h          Show this help message

Environment variables:
  HOST, PORT, PROTOCOL can also be set via environment variables
  `);
  process.exit(0);
}

// Parse command line arguments
let i = 0;
while (i < args.length) {
  switch (args[i]) {
    case '--host':
      config.host = args[++i];
      break;
    case '--port':
      config.port = parseInt(args[++i]);
      break;
    case '--protocol':
      config.protocol = args[++i];
      break;
    case '--timeout':
      config.timeout = parseInt(args[++i]);
      break;
    case '--retries':
      config.retries = parseInt(args[++i]);
      break;
    case '--interval':
      config.interval = parseInt(args[++i]);
      break;
  }
  i++;
}

// Start monitoring
runMonitoring().catch((error) => {
  console.error('💥 Monitoring failed:', error);
  process.exit(1);
});