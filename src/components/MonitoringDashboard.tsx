import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MonitoringMetrics {
  requestCount: number;
  rateLimitHits: number;
  botDetections: number;
  suspiciousBots: number;
  allowedBots: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
  memoryUsage: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  topPaths: Array<{
    path: string;
    count: number;
    avgResponseTime: number;
  }>;
  topUserAgents: Array<{
    userAgent: string;
    count: number;
    classification: 'human' | 'bot' | 'suspicious';
  }>;
  recentEvents: Array<{
    timestamp: string;
    type: 'rate_limit' | 'bot_detection' | 'suspicious_activity' | 'error';
    ip: string;
    path: string;
    details: any;
  }>;
}

// Mock API for demonstration - in real implementation, this would come from actual monitoring data
const mockGenerateMetrics = (): MonitoringMetrics => ({
  requestCount: Math.floor(Math.random() * 10000) + 5000,
  rateLimitHits: Math.floor(Math.random() * 50) + 10,
  botDetections: Math.floor(Math.random() * 200) + 50,
  suspiciousBots: Math.floor(Math.random() * 20) + 5,
  allowedBots: Math.floor(Math.random() * 100) + 30,
  averageResponseTime: Math.floor(Math.random() * 100) + 50,
  errorRate: Math.random() * 2,
  uptime: Math.floor(Math.random() * 86400) + 3600,
  memoryUsage: {
    rss: Math.floor(Math.random() * 200) + 100,
    heapUsed: Math.floor(Math.random() * 150) + 50,
    heapTotal: Math.floor(Math.random() * 200) + 100,
    external: Math.floor(Math.random() * 50) + 10
  },
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
});

const MonitoringDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<MonitoringMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/monitoring');
      if (response.ok) {
        const metrics = await response.json();
        setMetrics(metrics);
        setError(null);
        setLastUpdate(new Date());
      } else {
        throw new Error('Failed to fetch monitoring data');
      }
    } catch (err) {
      // Fallback to mock data if API fails
      const mockMetrics = mockGenerateMetrics();
      setMetrics(mockMetrics);
      setError('Using mock data - monitoring API unavailable');
      setLastUpdate(new Date());
      console.error('Monitoring error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    let interval: NodeJS.Timeout;
    
    if (autoRefresh) {
      interval = setInterval(fetchMetrics, 15000); // Update every 15 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatMemory = (mb: number) => {
    if (mb > 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb} MB`;
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'rate_limit':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'bot_detection':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'suspicious_activity':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'error':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getClassificationBadge = (classification: string) => {
    switch (classification) {
      case 'human':
        return <Badge variant="default" className="bg-green-100 text-green-800">Human</Badge>;
      case 'bot':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Bot</Badge>;
      case 'suspicious':
        return <Badge variant="destructive">Suspicious</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Monitoring Data Unavailable</div>
          <div className="text-gray-600">{error}</div>
          <button
            onClick={fetchMetrics}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Monitoring Dashboard
        </h1>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">Auto-refresh</span>
          </label>
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdate?.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">{metrics?.requestCount.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Total Requests</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{metrics?.averageResponseTime}ms</div>
          <div className="text-sm text-gray-600">Avg Response Time</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-600">{metrics?.rateLimitHits}</div>
          <div className="text-sm text-gray-600">Rate Limit Hits</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">{metrics?.errorRate.toFixed(2)}%</div>
          <div className="text-sm text-gray-600">Error Rate</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bot Detection Stats */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Bot Detection</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Detections:</span>
              <span className="font-semibold">{metrics?.botDetections}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Allowed Bots:</span>
              <span className="font-semibold text-green-600">{metrics?.allowedBots}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Suspicious Bots:</span>
              <span className="font-semibold text-red-600">{metrics?.suspiciousBots}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between">
                <span className="text-gray-600">Detection Rate:</span>
                <span className="font-semibold">
                  {metrics ? ((metrics.botDetections / metrics.requestCount) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* System Resources */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">System Resources</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Uptime:</span>
              <span className="font-semibold">{formatUptime(metrics?.uptime || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Memory (RSS):</span>
              <span className="font-semibold">{formatMemory(metrics?.memoryUsage.rss || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Heap Used:</span>
              <span className="font-semibold">{formatMemory(metrics?.memoryUsage.heapUsed || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Heap Total:</span>
              <span className="font-semibold">{formatMemory(metrics?.memoryUsage.heapTotal || 0)}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Paths */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top Requested Paths</h3>
          <div className="space-y-2">
            {metrics?.topPaths.map((path, index) => (
              <div key={path.path} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{index + 1}</span>
                  <span className="font-mono text-sm">{path.path}</span>
                </div>
                <div className="text-right text-sm">
                  <div className="font-semibold">{path.count}</div>
                  <div className="text-gray-500">{path.avgResponseTime}ms</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top User Agents */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top User Agents</h3>
          <div className="space-y-2">
            {metrics?.topUserAgents.map((ua, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{index + 1}</span>
                  <span className="font-mono text-xs truncate flex-1">{ua.userAgent}</span>
                </div>
                <div className="flex items-center space-x-2 ml-2">
                  <span className="text-sm font-semibold">{ua.count}</span>
                  {getClassificationBadge(ua.classification)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Events */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Security Events</h3>
        <div className="space-y-2">
          {metrics?.recentEvents.map((event, index) => (
            <div key={index} className="p-3 border-l-4 border-gray-200 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded ${getEventTypeColor(event.type)}`}>
                    {event.type.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="font-mono text-sm">{event.ip}</span>
                  <span className="text-sm text-gray-600">{event.path}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-xs text-gray-600 font-mono">
                {JSON.stringify(event.details)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <button
          onClick={fetchMetrics}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Refresh Data
        </button>
      </div>
    </div>
  );
};

export default MonitoringDashboard;