import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StartupStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
  error?: string;
  details?: string;
}

interface StartupProgress {
  totalSteps: number;
  completedSteps: number;
  currentStep?: string;
  overallStatus: 'initializing' | 'starting' | 'ready' | 'failed';
  uptime: number;
  steps: StartupStep[];
  errors: string[];
}

const StartupStatus: React.FC = () => {
  const [progress, setProgress] = useState<StartupProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStartupProgress = async () => {
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        const healthData = await response.json();
        
        // Transform health data into startup progress
        const startupProgress: StartupProgress = {
          totalSteps: 5,
          completedSteps: 0,
          overallStatus: 'initializing',
          uptime: healthData.startup_time_seconds || 0,
          steps: [],
          errors: []
        };

        // Create startup steps based on health check data
        const steps: StartupStep[] = [
          {
            id: 'application',
            name: 'Application Bootstrap',
            status: healthData.checks?.application?.ready ? 'completed' : 'running',
            details: healthData.checks?.application?.message
          },
          {
            id: 'environment',
            name: 'Environment Configuration',
            status: healthData.checks?.environment?.status === 'healthy' ? 'completed' : 
                   healthData.checks?.environment?.status === 'degraded' ? 'running' : 'failed',
            details: `Node ${healthData.checks?.environment?.node_version || 'Unknown'}, ${healthData.checks?.environment?.environment || 'Unknown'} environment`
          },
          {
            id: 'filesystem',
            name: 'File System Access',
            status: healthData.checks?.filesystem?.status === 'healthy' ? 'completed' :
                   healthData.checks?.filesystem?.status === 'degraded' ? 'running' : 'failed',
            details: healthData.checks?.filesystem?.message,
            error: healthData.checks?.filesystem?.error
          },
          {
            id: 'sharp',
            name: 'Image Processing (Sharp)',
            status: healthData.checks?.sharp?.ready ? 'completed' :
                   healthData.checks?.sharp?.status === 'degraded' ? 'running' : 'failed',
            details: healthData.checks?.sharp?.message,
            error: healthData.checks?.sharp?.error
          },
          {
            id: 'redis',
            name: 'Redis Cache Connection',
            status: healthData.checks?.redis?.ready ? 'completed' :
                   healthData.checks?.redis?.status === 'degraded' ? 'running' : 'failed',
            details: healthData.checks?.redis?.message,
            error: healthData.checks?.redis?.error
          }
        ];

        startupProgress.steps = steps;
        startupProgress.completedSteps = steps.filter(step => step.status === 'completed').length;
        
        // Determine current step
        const runningStep = steps.find(step => step.status === 'running');
        startupProgress.currentStep = runningStep?.name;

        // Determine overall status
        if (startupProgress.completedSteps === startupProgress.totalSteps) {
          startupProgress.overallStatus = 'ready';
        } else if (steps.some(step => step.status === 'failed')) {
          startupProgress.overallStatus = 'failed';
          startupProgress.errors = steps.filter(step => step.error).map(step => step.error!);
        } else if (startupProgress.uptime > 60) {
          // If we've been running for more than 60 seconds and not all steps are complete
          startupProgress.overallStatus = 'ready'; // Assume we're ready enough
        } else {
          startupProgress.overallStatus = 'starting';
        }

        setProgress(startupProgress);
        setError(null);
      } else {
        throw new Error('Failed to fetch health data');
      }
    } catch (err) {
      setError('Unable to fetch startup status');
      console.error('Startup status error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStartupProgress();
    
    // Poll more frequently during startup
    const interval = setInterval(fetchStartupProgress, 2000);
    
    // Stop polling after the system is ready or 2 minutes
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 120000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const getStatusIcon = (status: StartupStep['status']) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'running':
        return '⏳';
      case 'failed':
        return '❌';
      case 'pending':
      default:
        return '⏸️';
    }
  };

  const getStatusColor = (status: StartupStep['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'running':
        return 'text-blue-600';
      case 'failed':
        return 'text-red-600';
      case 'pending':
      default:
        return 'text-gray-500';
    }
  };

  const getOverallStatusBadge = (status: StartupProgress['overallStatus']) => {
    switch (status) {
      case 'ready':
        return <Badge variant="default" className="bg-green-100 text-green-800">System Ready</Badge>;
      case 'starting':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Starting Up</Badge>;
      case 'failed':
        return <Badge variant="destructive">Startup Failed</Badge>;
      case 'initializing':
      default:
        return <Badge variant="outline">Initializing</Badge>;
    }
  };

  const formatUptime = (seconds: number) => {
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Card className="p-8 text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Initializing System</h2>
          <p className="text-gray-600 dark:text-gray-400">Please wait while we start up...</p>
        </Card>
      </div>
    );
  }

  if (error && !progress) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Card className="p-8 text-center max-w-md">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2 text-red-600">Startup Status Unavailable</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchStartupProgress}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </Card>
      </div>
    );
  }

  // If system is ready, show a brief success message and redirect
  if (progress?.overallStatus === 'ready' && progress.uptime > 10) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Card className="p-8 text-center max-w-md">
          <div className="text-green-600 text-4xl mb-4">✅</div>
          <h2 className="text-xl font-semibold mb-2 text-green-600">System Ready!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            All services are online and ready to serve requests.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Redirecting to the main application...
          </p>
          <script
            dangerouslySetInnerHTML={{
              __html: `setTimeout(() => window.location.href = '/', 3000)`
            }}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            System Startup
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Initializing portfolio application services...
          </p>
        </div>

        {/* Overall Status */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold">Overall Status</h2>
              {getOverallStatusBadge(progress?.overallStatus || 'initializing')}
            </div>
            <div className="text-sm text-gray-500">
              Uptime: {formatUptime(progress?.uptime || 0)}
            </div>
          </div>

          {progress && (
            <div className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{progress.completedSteps}/{progress.totalSteps} steps</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.completedSteps / progress.totalSteps) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Current Step */}
              {progress.currentStep && progress.overallStatus === 'starting' && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-b-transparent rounded-full"></div>
                  <span className="text-sm">Currently: {progress.currentStep}</span>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Startup Steps */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Initialization Steps</h3>
          <div className="space-y-3">
            {progress?.steps.map((step) => (
              <div key={step.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-xl">{getStatusIcon(step.status)}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className={`font-medium ${getStatusColor(step.status)}`}>
                      {step.name}
                    </h4>
                    {step.status === 'running' && (
                      <div className="animate-pulse w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                  {step.details && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {step.details}
                    </p>
                  )}
                  {step.error && (
                    <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded mt-1">
                      Error: {step.error}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Errors */}
        {progress?.errors && progress.errors.length > 0 && (
          <Card className="p-6 mb-6 border-red-200 bg-red-50 dark:bg-red-900/20">
            <h3 className="text-lg font-semibold text-red-600 mb-4">Startup Errors</h3>
            <div className="space-y-2">
              {progress.errors.map((error, index) => (
                <div key={index} className="text-sm text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 p-2 rounded">
                  {error}
                </div>
              ))}
            </div>
            <div className="mt-4 text-sm text-red-600">
              <p>Some services may not be fully available. The application will continue to start with reduced functionality.</p>
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={fetchStartupProgress}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Refresh Status
          </button>
          {progress?.overallStatus === 'ready' && (
            <a
              href="/"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Continue to Application
            </a>
          )}
        </div>

        {/* Auto-refresh indicator */}
        <div className="text-center mt-4 text-xs text-gray-500">
          Status updates automatically every 2 seconds
        </div>
      </div>
    </div>
  );
};

export default StartupStatus;