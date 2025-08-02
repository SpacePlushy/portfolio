/**
 * Unified monitoring endpoint for production metrics
 * Provides real-time performance and health metrics
 */

import { getSharpStatus } from '../../utils/sharp-loader.js';
import { createClient } from 'redis';

// Metrics storage (in production, use Redis or similar)
const metrics = {
  requests: new Map(),
  errors: [],
  performance: [],
  startTime: Date.now(),
  memory: {
    snapshots: [],
    maxRss: 0
  }
};

// Public API to record metrics from middleware
export function recordMetric(type, data) {
  switch (type) {
    case 'request':
      recordRequest(data);
      break;
    case 'error':
      recordError(data);
      break;
    case 'performance':
      recordPerformance(data);
      break;
  }
}

function recordRequest(data) {
  const key = `${data.path}:${data.status}`;
  const current = metrics.requests.get(key) || { count: 0, totalTime: 0 };
  current.count++;
  current.totalTime += data.responseTime;
  metrics.requests.set(key, current);
  
  metrics.performance.push({
    timestamp: Date.now(),
    path: data.path,
    responseTime: data.responseTime,
    status: data.status
  });
  
  // Keep only last 1000 entries
  if (metrics.performance.length > 1000) {
    metrics.performance = metrics.performance.slice(-1000);
  }
}

function recordError(data) {
  metrics.errors.push({
    timestamp: Date.now(),
    ...data
  });
  
  // Keep only last 100 errors
  if (metrics.errors.length > 100) {
    metrics.errors = metrics.errors.slice(-100);
  }
}

function recordPerformance(data) {
  metrics.performance.push({
    timestamp: Date.now(),
    ...data
  });
  
  if (metrics.performance.length > 1000) {
    metrics.performance = metrics.performance.slice(-1000);
  }
}

export async function GET({ url }) {
  const query = new URL(url).searchParams;
  const format = query.get('format') || 'json';
  const period = parseInt(query.get('period') || '300', 10); // Default 5 minutes
  
  // Capture current state
  const now = Date.now();
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  // Record memory snapshot
  metrics.memory.snapshots.push({
    timestamp: now,
    rss: memoryUsage.rss,
    heapUsed: memoryUsage.heapUsed,
    heapTotal: memoryUsage.heapTotal,
    external: memoryUsage.external
  });
  
  metrics.memory.maxRss = Math.max(metrics.memory.maxRss, memoryUsage.rss);
  
  // Keep only recent snapshots
  const cutoff = now - (period * 1000);
  metrics.memory.snapshots = metrics.memory.snapshots.filter(s => s.timestamp > cutoff);
  
  // Calculate metrics
  const recentPerformance = metrics.performance.filter(p => p.timestamp > cutoff);
  const recentErrors = metrics.errors.filter(e => e.timestamp > cutoff);
  
  // Aggregate request stats
  const requestStats = aggregateRequestStats(metrics.requests, recentPerformance);
  
  // Get service health
  const services = {
    sharp: getSharpStatus(),
    redis: await checkRedisHealth(),
    system: getSystemHealth(memoryUsage, cpuUsage)
  };
  
  // Build response
  const response = {
    timestamp: new Date().toISOString(),
    period: `${period}s`,
    uptime: {
      seconds: Math.floor((now - metrics.startTime) / 1000),
      process: Math.floor(process.uptime())
    },
    requests: {
      total: requestStats.total,
      rate: requestStats.total / period,
      byStatus: requestStats.byStatus,
      topPaths: requestStats.topPaths,
      performance: {
        avg: Math.round(requestStats.avgResponseTime),
        p50: Math.round(requestStats.p50),
        p90: Math.round(requestStats.p90),
        p99: Math.round(requestStats.p99)
      }
    },
    errors: {
      total: recentErrors.length,
      rate: recentErrors.length / period,
      recent: recentErrors.slice(-5).map(e => ({
        ...e,
        ago: formatTimeAgo(now - e.timestamp)
      }))
    },
    memory: {
      current: {
        rss: formatBytes(memoryUsage.rss),
        heapUsed: formatBytes(memoryUsage.heapUsed),
        heapTotal: formatBytes(memoryUsage.heapTotal),
        external: formatBytes(memoryUsage.external),
        percentUsed: ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(1)
      },
      max: {
        rss: formatBytes(metrics.memory.maxRss)
      },
      trend: calculateMemoryTrend(metrics.memory.snapshots)
    },
    cpu: {
      user: Math.round(cpuUsage.user / 1000),
      system: Math.round(cpuUsage.system / 1000)
    },
    services,
    health: calculateOverallHealth(services, requestStats, memoryUsage)
  };
  
  // Return in requested format
  if (format === 'prometheus') {
    return prometheusFormat(response);
  }
  
  return new Response(JSON.stringify(response, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}

// Helper functions
function aggregateRequestStats(requests, recentPerformance) {
  const stats = {
    total: 0,
    byStatus: {},
    byPath: {},
    avgResponseTime: 0,
    p50: 0,
    p90: 0,
    p99: 0,
    topPaths: []
  };
  
  // Aggregate by status and path
  for (const [key, data] of requests.entries()) {
    const [path, status] = key.split(':');
    stats.total += data.count;
    
    stats.byStatus[status] = (stats.byStatus[status] || 0) + data.count;
    
    if (!stats.byPath[path]) {
      stats.byPath[path] = { count: 0, avgTime: 0 };
    }
    stats.byPath[path].count += data.count;
    stats.byPath[path].avgTime = data.totalTime / data.count;
  }
  
  // Calculate percentiles from recent performance
  if (recentPerformance.length > 0) {
    const responseTimes = recentPerformance.map(p => p.responseTime).sort((a, b) => a - b);
    stats.avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    stats.p50 = percentile(responseTimes, 50);
    stats.p90 = percentile(responseTimes, 90);
    stats.p99 = percentile(responseTimes, 99);
  }
  
  // Get top paths
  stats.topPaths = Object.entries(stats.byPath)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([path, data]) => ({
      path,
      count: data.count,
      avgTime: Math.round(data.avgTime)
    }));
  
  return stats;
}

function percentile(sorted, p) {
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

function formatBytes(bytes) {
  const mb = bytes / 1024 / 1024;
  return mb < 1 ? `${(bytes / 1024).toFixed(1)}KB` : `${mb.toFixed(1)}MB`;
}

function formatTimeAgo(ms) {
  if (ms < 1000) return 'just now';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function calculateMemoryTrend(snapshots) {
  if (snapshots.length < 2) return 'stable';
  
  const recent = snapshots.slice(-10);
  const firstRss = recent[0].rss;
  const lastRss = recent[recent.length - 1].rss;
  const change = ((lastRss - firstRss) / firstRss) * 100;
  
  if (change > 10) return 'increasing ↑';
  if (change < -10) return 'decreasing ↓';
  return 'stable →';
}

async function checkRedisHealth() {
  if (!process.env.REDIS_URL) {
    return { status: 'disabled', message: 'Redis not configured' };
  }
  
  try {
    const client = createClient({
      url: process.env.REDIS_URL,
      socket: { connectTimeout: 1000 }
    });
    
    const start = Date.now();
    await client.connect();
    await client.ping();
    const latency = Date.now() - start;
    await client.quit();
    
    return {
      status: 'healthy',
      latency: `${latency}ms`,
      url: process.env.REDIS_URL.replace(/:[^:]*@/, ':***@')
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

function getSystemHealth(memory, cpu) {
  const warnings = [];
  
  const rssLimit = 450 * 1024 * 1024; // 450MB warning
  const heapLimit = 0.9; // 90% heap usage warning
  
  if (memory.rss > rssLimit) {
    warnings.push(`High memory: ${(memory.rss / 1024 / 1024).toFixed(0)}MB`);
  }
  
  if (memory.heapUsed / memory.heapTotal > heapLimit) {
    warnings.push(`Heap critical: ${((memory.heapUsed / memory.heapTotal) * 100).toFixed(0)}%`);
  }
  
  return {
    status: warnings.length === 0 ? 'healthy' : 'warning',
    warnings
  };
}

function calculateOverallHealth(services, requests, memory) {
  const issues = [];
  
  // Check services
  for (const [name, service] of Object.entries(services)) {
    if (service.status === 'unhealthy') {
      issues.push(`${name} unhealthy`);
    }
  }
  
  // Check memory
  if (memory.rss > 450 * 1024 * 1024) {
    issues.push('High memory usage');
  }
  
  // Check response times
  if (requests.p90 > 1000) {
    issues.push('Slow responses');
  }
  
  return {
    status: issues.length === 0 ? 'healthy' : issues.length > 2 ? 'critical' : 'degraded',
    issues
  };
}

function prometheusFormat(metrics) {
  const lines = [
    '# HELP app_uptime_seconds Application uptime',
    '# TYPE app_uptime_seconds counter',
    `app_uptime_seconds ${metrics.uptime.seconds}`,
    '',
    '# HELP app_requests_total Total requests',
    '# TYPE app_requests_total counter',
    `app_requests_total ${metrics.requests.total}`,
    '',
    '# HELP app_request_duration_ms Request duration percentiles',
    '# TYPE app_request_duration_ms summary',
    `app_request_duration_ms{quantile="0.5"} ${metrics.requests.performance.p50}`,
    `app_request_duration_ms{quantile="0.9"} ${metrics.requests.performance.p90}`,
    `app_request_duration_ms{quantile="0.99"} ${metrics.requests.performance.p99}`,
    '',
    '# HELP app_memory_bytes Memory usage',
    '# TYPE app_memory_bytes gauge',
    `app_memory_bytes{type="rss"} ${process.memoryUsage().rss}`,
    `app_memory_bytes{type="heap_used"} ${process.memoryUsage().heapUsed}`,
    `app_memory_bytes{type="heap_total"} ${process.memoryUsage().heapTotal}`,
    '',
    '# HELP app_errors_total Total errors',
    '# TYPE app_errors_total counter',
    `app_errors_total ${metrics.errors.total}`
  ];
  
  return new Response(lines.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4',
      'Cache-Control': 'no-cache'
    }
  });
}