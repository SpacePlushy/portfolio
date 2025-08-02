/**
 * Simple monitoring endpoint that returns mock data for testing
 * This matches the expected format from monitoring.test.ts
 */

// Mock data generator functions
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMockMetrics() {
  try {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    // Generate mock paths data
    const paths = [
      { path: '/', count: getRandomInt(2000, 3000), avgResponseTime: getRandomInt(10, 20) },
      { path: '/software-engineer', count: getRandomInt(1500, 2000), avgResponseTime: getRandomInt(15, 25) },
      { path: '/customer-service', count: getRandomInt(1000, 1500), avgResponseTime: getRandomInt(15, 25) },
      { path: '/api/health', count: getRandomInt(500, 800), avgResponseTime: getRandomInt(5, 15) },
      { path: '/health-status', count: getRandomInt(300, 500), avgResponseTime: getRandomInt(20, 30) },
      { path: '/api/image-optimize', count: getRandomInt(200, 400), avgResponseTime: getRandomInt(50, 100) }
    ];

    // Generate mock user agents
    const userAgents = [
      { 
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        count: getRandomInt(3000, 4000),
        classification: 'human'
      },
      {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        count: getRandomInt(2500, 3500),
        classification: 'human'
      },
      {
        userAgent: 'Googlebot/2.1 (+http://www.google.com/bot.html)',
        count: getRandomInt(100, 200),
        classification: 'bot'
      },
      {
        userAgent: 'bingbot/2.0; +http://www.bing.com/bingbot.htm',
        count: getRandomInt(80, 150),
        classification: 'bot'
      },
      {
        userAgent: 'suspicious-scanner/1.0',
        count: getRandomInt(10, 30),
        classification: 'suspicious'
      }
    ];

    // Generate recent events
    const now = Date.now();
    const events = [
      {
        timestamp: new Date(now - getRandomInt(0, 3600000)).toISOString(),
        type: 'rate_limit',
        ip: `192.168.1.${getRandomInt(1, 255)}`,
        path: '/api/monitoring',
        details: {
          limit: 100,
          current: getRandomInt(101, 150)
        }
      },
      {
        timestamp: new Date(now - getRandomInt(0, 3600000)).toISOString(),
        type: 'bot_detection',
        ip: `10.0.0.${getRandomInt(1, 255)}`,
        path: '/',
        details: {
          confidence: getRandomInt(70, 95),
          signals: ['user-agent', 'behavior', 'rate']
        }
      },
      {
        timestamp: new Date(now - getRandomInt(0, 3600000)).toISOString(),
        type: 'suspicious_activity',
        ip: `172.16.0.${getRandomInt(1, 255)}`,
        path: '/admin',
        details: {
          rapidRequests: getRandomInt(50, 100),
          uniquePaths: getRandomInt(10, 30)
        }
      }
    ];

    return {
      requestCount: getRandomInt(5000, 15000),
      rateLimitHits: getRandomInt(10, 60),
      botDetections: getRandomInt(50, 250),
      suspiciousBots: getRandomInt(5, 25),
      allowedBots: getRandomInt(30, 130),
      averageResponseTime: getRandomInt(50, 150),
      errorRate: Math.random() * 2, // 0-2%
      uptime: Math.floor(uptime),
      memoryUsage: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024)
      },
      topPaths: paths,
      topUserAgents: userAgents,
      recentEvents: events
    };
  } catch (error) {
    console.error('Error generating monitoring metrics:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const metrics = generateMockMetrics();
    
    return new Response(JSON.stringify(metrics, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to fetch monitoring metrics',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}