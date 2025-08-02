import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp?: string;
  uptime?: number;
  startup_time?: number;
  memory?: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  version?: string;
  ready?: boolean;
  message?: string;
  error?: string;
  timeout?: boolean;
  node_version?: string;
  environment?: string;
  port?: string | number;
  host?: string;
  url?: string;
}

interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  response_time_ms: number;
  startup_time_seconds: number;
  checks: {
    application: HealthCheck;
    environment: HealthCheck;
    sharp: HealthCheck;
    redis: HealthCheck;
    filesystem: HealthCheck;
    startup_error?: HealthCheck;
    error?: HealthCheck;
  };
}

interface ReadinessData {
  ready: boolean;
  uptime: number;
  timestamp: string;
  message: string;
}

const HealthStatusDashboard: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [readinessData, setReadinessData] = useState<ReadinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchHealthData = async () => {
    try {
      const [healthResponse, readinessResponse] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/readiness')
      ]);

      if (healthResponse.ok) {
        const health = await healthResponse.json();
        setHealthData(health);
      }

      if (readinessResponse.ok) {
        const readiness = await readinessResponse.json();
        setReadinessData(readiness);
      }

      setError(null);
      setLastUpdate(new Date());
    } catch (err) {
      setError('Failed to fetch health data');
      console.error('Health check error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'unhealthy':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'default';
      case 'degraded':
        return 'secondary';
      case 'unhealthy':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const formatMemory = (mb: number) => {
    if (mb > 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !healthData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Health Check Failed</div>
          <div className="text-gray-600">{error}</div>
          <button
            onClick={fetchHealthData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Health Status Dashboard
        </h1>
        <div className="text-sm text-gray-500">
          Last updated: {lastUpdate?.toLocaleTimeString()}
        </div>
      </div>

      {/* Overall Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Overall System Status</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(healthData?.status || 'unhealthy')}`}></div>
            <Badge variant={getStatusBadgeVariant(healthData?.status || 'unhealthy')}>
              {healthData?.status?.toUpperCase() || 'UNKNOWN'}
            </Badge>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Response Time:</span>
            <span className="ml-2 font-mono">{healthData?.response_time_ms}ms</span>
          </div>
          <div>
            <span className="text-gray-500">Startup Time:</span>
            <span className="ml-2 font-mono">{healthData?.startup_time_seconds}s</span>
          </div>
          <div>
            <span className="text-gray-500">Readiness:</span>
            <span className={`ml-2 font-semibold ${readinessData?.ready ? 'text-green-600' : 'text-red-600'}`}>
              {readinessData?.ready ? 'READY' : 'NOT READY'}
            </span>
          </div>
        </div>
      </Card>

      {/* Service Checks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {healthData?.checks && Object.entries(healthData.checks).map(([service, check]) => (
          <Card key={service} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold capitalize">{service}</h3>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(check.status)}`}></div>
                <Badge variant={getStatusBadgeVariant(check.status)} className="text-xs">
                  {check.status}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              {check.message && (
                <div className="text-gray-600 dark:text-gray-400">{check.message}</div>
              )}
              
              {check.error && (
                <div className="text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded text-xs">
                  {check.error}
                </div>
              )}

              {service === 'application' && check.memory && (
                <div className="space-y-1">
                  <div><span className="text-gray-500">Memory (RSS):</span> <span className="font-mono">{formatMemory(check.memory.rss)}</span></div>
                  <div><span className="text-gray-500">Heap Used:</span> <span className="font-mono">{formatMemory(check.memory.heapUsed)}</span></div>
                  <div><span className="text-gray-500">Heap Total:</span> <span className="font-mono">{formatMemory(check.memory.heapTotal)}</span></div>
                  <div><span className="text-gray-500">Uptime:</span> <span className="font-mono">{formatUptime(check.uptime || 0)}</span></div>
                  {check.version && <div><span className="text-gray-500">Version:</span> <span className="font-mono">{check.version}</span></div>}
                </div>
              )}

              {service === 'environment' && (
                <div className="space-y-1">
                  {check.node_version && <div><span className="text-gray-500">Node:</span> <span className="font-mono">{check.node_version}</span></div>}
                  {check.environment && <div><span className="text-gray-500">Env:</span> <span className="font-mono">{check.environment}</span></div>}
                  {check.port && <div><span className="text-gray-500">Port:</span> <span className="font-mono">{check.port}</span></div>}
                  {check.host && <div><span className="text-gray-500">Host:</span> <span className="font-mono">{check.host}</span></div>}
                </div>
              )}

              {service === 'redis' && check.url && (
                <div><span className="text-gray-500">URL:</span> <span className="font-mono text-xs">{check.url}</span></div>
              )}

              {check.ready !== undefined && (
                <div><span className="text-gray-500">Ready:</span> <span className={check.ready ? 'text-green-600' : 'text-red-600'}>{check.ready ? 'Yes' : 'No'}</span></div>
              )}

              {check.timeout && (
                <div className="text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-xs">
                  Check timed out
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Startup Status */}
      {healthData?.startup_time_seconds && healthData.startup_time_seconds < 60 && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <div className="text-blue-800 dark:text-blue-200 font-semibold">System Starting Up</div>
          </div>
          <div className="text-blue-600 dark:text-blue-300 text-sm mt-1">
            Services are initializing. Some features may be temporarily unavailable.
            Startup time: {healthData.startup_time_seconds}s
          </div>
        </Card>
      )}

      {/* Refresh Button */}
      <div className="flex justify-center">
        <button
          onClick={fetchHealthData}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Refresh Status
        </button>
      </div>
    </div>
  );
};

export default HealthStatusDashboard;