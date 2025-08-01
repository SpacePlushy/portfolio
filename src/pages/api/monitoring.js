// Basic monitoring API endpoint
// In a production environment, this would integrate with actual monitoring systems

export async function GET() {
  try {
    // In a real implementation, this would fetch from monitoring databases
    // For now, we'll simulate some realistic metrics
    
    const mockMetrics = {
      requestCount: Math.floor(Math.random() * 10000) + 5000,
      rateLimitHits: Math.floor(Math.random() * 50) + 10,
      botDetections: Math.floor(Math.random() * 200) + 50,
      suspiciousBots: Math.floor(Math.random() * 20) + 5,
      allowedBots: Math.floor(Math.random() * 100) + 30,
      averageResponseTime: Math.floor(Math.random() * 100) + 50,
      errorRate: Math.random() * 2,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      
      topPaths: [
        { path: '/', count: Math.floor(Math.random() * 1000) + 500, avgResponseTime: Math.floor(Math.random() * 100) + 20 },
        { path: '/software-engineer', count: Math.floor(Math.random() * 800) + 300, avgResponseTime: Math.floor(Math.random() * 100) + 25 },
        { path: '/customer-service', count: Math.floor(Math.random() * 600) + 200, avgResponseTime: Math.floor(Math.random() * 100) + 30 },
        { path: '/api/health', count: Math.floor(Math.random() * 2000) + 1000, avgResponseTime: Math.floor(Math.random() * 20) + 5 },
        { path: '/health-status', count: Math.floor(Math.random() * 100) + 50, avgResponseTime: Math.floor(Math.random() * 150) + 100 }
      ],
      
      topUserAgents: [
        { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', count: Math.floor(Math.random() * 500) + 200, classification: 'human' },
        { userAgent: 'Googlebot/2.1 (+http://www.google.com/bot.html)', count: Math.floor(Math.random() * 200) + 100, classification: 'bot' },
        { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', count: Math.floor(Math.random() * 400) + 150, classification: 'human' },
        { userAgent: 'python-requests/2.28.1', count: Math.floor(Math.random() * 50) + 10, classification: 'suspicious' },
        { userAgent: 'bingbot/2.0 (+http://www.bing.com/bingbot.htm)', count: Math.floor(Math.random() * 150) + 50, classification: 'bot' }
      ],
      
      recentEvents: [
        {
          timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          type: 'rate_limit',
          ip: '192.168.1.' + Math.floor(Math.random() * 255),
          path: '/api/health',
          details: { limit: 100, current: 105 }
        },
        {
          timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          type: 'bot_detection',
          ip: '10.0.0.' + Math.floor(Math.random() * 255),
          path: '/',
          details: { confidence: 85, signals: ['suspicious_user_agent', 'missing_accept_language'] }
        },
        {
          timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          type: 'suspicious_activity',
          ip: '172.16.0.' + Math.floor(Math.random() * 255),
          path: '/api/image-optimize',
          details: { rapidRequests: 25, uniquePaths: 15 }
        }
      ]
    };

    // Convert memory usage from bytes to MB
    mockMetrics.memoryUsage = {
      rss: Math.round(mockMetrics.memoryUsage.rss / 1024 / 1024),
      heapUsed: Math.round(mockMetrics.memoryUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mockMetrics.memoryUsage.heapTotal / 1024 / 1024),
      external: Math.round(mockMetrics.memoryUsage.external / 1024 / 1024)
    };

    return new Response(JSON.stringify(mockMetrics, null, 2), {
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