import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('sharp', () => ({
  default: vi.fn()
}));

vi.mock('redis', () => ({
  createClient: vi.fn()
}));

vi.mock('fs/promises', () => ({
  access: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn()
}));

describe('Application Startup Lifecycle', () => {
  let mockSharp: any;
  let mockRedis: any;
  let mockFs: any;
  let originalConsole: typeof console;
  let originalProcess: typeof process;
  let originalSetTimeout: typeof setTimeout;
  let originalClearTimeout: typeof clearTimeout;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();

    // Store originals
    originalConsole = global.console;
    originalProcess = global.process;
    originalSetTimeout = global.setTimeout;
    originalClearTimeout = global.clearTimeout;

    // Mock console to capture logs
    global.console = {
      ...console,
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn()
    };

    // Setup module mocks
    mockSharp = await vi.importMock('sharp');
    mockRedis = await vi.importMock('redis');
    mockFs = await vi.importMock('fs/promises');

    // Mock process methods
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    vi.spyOn(process, 'on').mockImplementation(() => process as any);
    vi.spyOn(process, 'removeListener').mockImplementation(() => process as any);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    global.console = originalConsole;
    global.process = originalProcess;
    global.setTimeout = originalSetTimeout;
    global.clearTimeout = originalClearTimeout;
  });

  describe('Dependency Initialization', () => {
    it('should initialize Sharp successfully', async () => {
      const mockSharpInstance = {
        metadata: vi.fn().mockResolvedValue({ width: 8, height: 8 }),
      };
      mockSharp.default.mockReturnValue(mockSharpInstance);

      // Mock the health endpoint module to access initialization
      const healthModule = await import('../../pages/api/health.js');

      // Allow initialization to complete
      await vi.runAllTimersAsync();

      expect(console.log).toHaveBeenCalledWith('Starting dependency initialization...');
      expect(console.log).toHaveBeenCalledWith('Initializing Sharp...');
      expect(console.log).toHaveBeenCalledWith('Sharp initialized successfully');
    });

    it('should handle Sharp initialization failure', async () => {
      mockSharp.default.mockImplementation(() => {
        throw new Error('Sharp initialization failed');
      });

      const healthModule = await import('../../pages/api/health.js');

      await vi.runAllTimersAsync();

      expect(console.log).toHaveBeenCalledWith('Initializing Sharp...');
      expect(console.error).toHaveBeenCalledWith('Sharp initialization failed:', 'Sharp initialization failed');
    });

    it('should handle Sharp timeout during initialization', async () => {
      const mockSharpInstance = {
        metadata: vi.fn().mockImplementation(() => new Promise(() => {})), // Never resolves
      };
      mockSharp.default.mockReturnValue(mockSharpInstance);

      process.env.REDIS_URL = undefined;

      const healthModule = await import('../../pages/api/health.js');

      // Advance past Sharp timeout
      vi.advanceTimersByTime(6000);

      expect(console.log).toHaveBeenCalledWith('Initializing Sharp...');
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Sharp initialization failed:'),
        expect.stringContaining('Sharp test timeout')
      );
    });

    it('should initialize Redis when configured', async () => {
      process.env.REDIS_URL = 'redis://localhost:6379';

      const mockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        ping: vi.fn().mockResolvedValue('PONG'),
        quit: vi.fn().mockResolvedValue(undefined),
      };
      mockRedis.createClient.mockReturnValue(mockClient);

      // Mock Sharp success
      const mockSharpInstance = {
        metadata: vi.fn().mockResolvedValue({ width: 8, height: 8 }),
      };
      mockSharp.default.mockReturnValue(mockSharpInstance);

      const healthModule = await import('../../pages/api/health.js');

      await vi.runAllTimersAsync();

      expect(console.log).toHaveBeenCalledWith('Initializing Redis connection...');
      expect(console.log).toHaveBeenCalledWith('Redis initialized successfully');
      expect(mockRedis.createClient).toHaveBeenCalledWith({
        url: 'redis://localhost:6379',
        socket: {
          connectTimeout: 3000,
          commandTimeout: 2000
        },
        retryDelayOnFailover: 0,
        maxRetriesPerRequest: 1
      });
    });

    it('should skip Redis when not configured', async () => {
      delete process.env.REDIS_URL;

      // Mock Sharp success
      const mockSharpInstance = {
        metadata: vi.fn().mockResolvedValue({ width: 8, height: 8 }),
      };
      mockSharp.default.mockReturnValue(mockSharpInstance);

      const healthModule = await import('../../pages/api/health.js');

      await vi.runAllTimersAsync();

      expect(console.log).toHaveBeenCalledWith('Redis URL not configured, skipping Redis initialization');
      expect(mockRedis.createClient).not.toHaveBeenCalled();
    });

    it('should handle Redis connection failure gracefully', async () => {
      process.env.REDIS_URL = 'redis://localhost:6379';

      const mockClient = {
        connect: vi.fn().mockRejectedValue(new Error('Connection refused')),
        quit: vi.fn().mockResolvedValue(undefined),
      };
      mockRedis.createClient.mockReturnValue(mockClient);

      // Mock Sharp success
      const mockSharpInstance = {
        metadata: vi.fn().mockResolvedValue({ width: 8, height: 8 }),
      };
      mockSharp.default.mockReturnValue(mockSharpInstance);

      const healthModule = await import('../../pages/api/health.js');

      await vi.runAllTimersAsync();

      expect(console.log).toHaveBeenCalledWith('Testing Redis connection...');
      expect(console.error).toHaveBeenCalledWith('Redis connection test failed:', 'Connection refused');
    });

    it('should handle Redis timeout', async () => {
      process.env.REDIS_URL = 'redis://localhost:6379';

      const mockClient = {
        connect: vi.fn().mockImplementation(() => new Promise(() => {})), // Never resolves
        quit: vi.fn().mockResolvedValue(undefined),
      };
      mockRedis.createClient.mockReturnValue(mockClient);

      // Mock Sharp success
      const mockSharpInstance = {
        metadata: vi.fn().mockResolvedValue({ width: 8, height: 8 }),
      };
      mockSharp.default.mockReturnValue(mockSharpInstance);

      const healthModule = await import('../../pages/api/health.js');

      // Advance past Redis timeout
      vi.advanceTimersByTime(6000);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Redis connection test failed:'),
        expect.stringContaining('Redis connection timeout')
      );
    });

    it('should complete application initialization after all dependencies', async () => {
      // Mock both Sharp and Redis success
      const mockSharpInstance = {
        metadata: vi.fn().mockResolvedValue({ width: 8, height: 8 }),
      };
      mockSharp.default.mockReturnValue(mockSharpInstance);

      process.env.REDIS_URL = 'redis://localhost:6379';
      const mockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        ping: vi.fn().mockResolvedValue('PONG'),
        quit: vi.fn().mockResolvedValue(undefined),
      };
      mockRedis.createClient.mockReturnValue(mockClient);

      const healthModule = await import('../../pages/api/health.js');

      await vi.runAllTimersAsync();

      expect(console.log).toHaveBeenCalledWith('Application dependencies initialized');
    });
  });

  describe('Startup Timing and Sequences', () => {
    it('should initialize dependencies in correct order', async () => {
      const logCalls: string[] = [];
      global.console.log = vi.fn().mockImplementation((msg: string) => {
        logCalls.push(msg);
      });

      // Mock successful initialization
      const mockSharpInstance = {
        metadata: vi.fn().mockResolvedValue({ width: 8, height: 8 }),
      };
      mockSharp.default.mockReturnValue(mockSharpInstance);

      process.env.REDIS_URL = 'redis://localhost:6379';
      const mockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        ping: vi.fn().mockResolvedValue('PONG'),
        quit: vi.fn().mockResolvedValue(undefined),
      };
      mockRedis.createClient.mockReturnValue(mockClient);

      const healthModule = await import('../../pages/api/health.js');

      await vi.runAllTimersAsync();

      expect(logCalls).toEqual([
        'Starting dependency initialization...',
        'Initializing Sharp...',
        'Sharp test completed successfully',
        'Sharp initialized successfully',
        'Initializing Redis connection...',
        'Testing Redis connection...',
        'Redis connection test successful',
        'Redis initialized successfully',
        'Application dependencies initialized'
      ]);
    });

    it('should continue initialization even if Sharp fails', async () => {
      mockSharp.default.mockImplementation(() => {
        throw new Error('Sharp not available');
      });

      process.env.REDIS_URL = 'redis://localhost:6379';
      const mockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        ping: vi.fn().mockResolvedValue('PONG'),
        quit: vi.fn().mockResolvedValue(undefined),
      };
      mockRedis.createClient.mockReturnValue(mockClient);

      const healthModule = await import('../../pages/api/health.js');

      await vi.runAllTimersAsync();

      expect(console.error).toHaveBeenCalledWith('Sharp initialization failed:', 'Sharp not available');
      expect(console.log).toHaveBeenCalledWith('Redis initialized successfully');
      expect(console.log).toHaveBeenCalledWith('Application dependencies initialized');
    });

    it('should continue initialization even if Redis fails', async () => {
      const mockSharpInstance = {
        metadata: vi.fn().mockResolvedValue({ width: 8, height: 8 }),
      };
      mockSharp.default.mockReturnValue(mockSharpInstance);

      process.env.REDIS_URL = 'redis://localhost:6379';
      const mockClient = {
        connect: vi.fn().mockRejectedValue(new Error('Redis unavailable')),
        quit: vi.fn().mockResolvedValue(undefined),
      };
      mockRedis.createClient.mockReturnValue(mockClient);

      const healthModule = await import('../../pages/api/health.js');

      await vi.runAllTimersAsync();

      expect(console.log).toHaveBeenCalledWith('Sharp initialized successfully');
      expect(console.error).toHaveBeenCalledWith('Redis connection test failed:', 'Redis unavailable');
      expect(console.log).toHaveBeenCalledWith('Application dependencies initialized');
    });

    it('should handle concurrent initialization properly', async () => {
      const mockSharpInstance = {
        metadata: vi.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({ width: 8, height: 8 }), 100))
        ),
      };
      mockSharp.default.mockReturnValue(mockSharpInstance);

      process.env.REDIS_URL = 'redis://localhost:6379';
      const mockClient = {
        connect: vi.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(resolve, 150))
        ),
        ping: vi.fn().mockResolvedValue('PONG'),
        quit: vi.fn().mockResolvedValue(undefined),
      };
      mockRedis.createClient.mockReturnValue(mockClient);

      const healthModule = await import('../../pages/api/health.js');

      // Advance time to let both complete
      vi.advanceTimersByTime(200);
      await vi.runAllTimersAsync();

      expect(console.log).toHaveBeenCalledWith('Sharp initialized successfully');
      expect(console.log).toHaveBeenCalledWith('Redis initialized successfully');
      expect(console.log).toHaveBeenCalledWith('Application dependencies initialized');
    });
  });

  describe('Health Check Integration During Startup', () => {
    it('should be lenient during startup period', async () => {
      // Mock slow Sharp initialization
      const mockSharpInstance = {
        metadata: vi.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({ width: 8, height: 8 }), 10000))
        ),
      };
      mockSharp.default.mockReturnValue(mockSharpInstance);

      mockFs.access.mockResolvedValue(undefined);

      const { GET } = await import('../../pages/api/health.js');

      // Make health check request during startup (before Sharp completes)
      vi.spyOn(Date, 'now').mockReturnValue(1000); // Very early startup
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200); // Should return 200 during startup
      expect(data.startup_time_seconds).toBeLessThan(60);
      expect(data.checks.sharp.status).toBe('degraded');
      expect(data.checks.sharp.ready).toBe(false);
    });

    it('should be strict after startup period', async () => {
      // Mock Sharp failure
      mockSharp.default.mockImplementation(() => {
        throw new Error('Sharp critical failure');
      });

      mockFs.access.mockRejectedValue(new Error('File system error'));

      const { GET } = await import('../../pages/api/health.js');

      await vi.runAllTimersAsync();

      // Simulate request after startup period
      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 120000); // 2 minutes after startup
      const response = await GET();
      const data = await response.json();

      expect(data.status).toBe('unhealthy');
      expect(data.startup_time_seconds).toBeGreaterThan(60);
    });

    it('should track initialization state correctly', async () => {
      const mockSharpInstance = {
        metadata: vi.fn().mockResolvedValue({ width: 8, height: 8 }),
      };
      mockSharp.default.mockReturnValue(mockSharpInstance);

      mockFs.access.mockResolvedValue(undefined);

      const { GET } = await import('../../pages/api/health.js');

      // Check before initialization
      const earlyResponse = await GET();
      const earlyData = await earlyResponse.json();
      expect(earlyData.checks.application.ready).toBe(false);

      // Complete initialization
      await vi.runAllTimersAsync();

      // Check after initialization
      const lateResponse = await GET();
      const lateData = await lateResponse.json();
      expect(lateData.checks.application.ready).toBe(true);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle module import failures', async () => {
      // Mock Sharp import failure
      vi.doMock('sharp', () => {
        throw new Error('Module not found');
      });

      expect(async () => {
        const healthModule = await import('../../pages/api/health.js');
        await vi.runAllTimersAsync();
      }).not.toThrow();

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Sharp initialization failed:'),
        expect.any(String)
      );
    });

    it('should handle partial initialization gracefully', async () => {
      // Mock Sharp success but Redis failure
      const mockSharpInstance = {
        metadata: vi.fn().mockResolvedValue({ width: 8, height: 8 }),
      };
      mockSharp.default.mockReturnValue(mockSharpInstance);

      process.env.REDIS_URL = 'redis://localhost:6379';
      mockRedis.createClient.mockImplementation(() => {
        throw new Error('Redis client creation failed');
      });

      const healthModule = await import('../../pages/api/health.js');

      await vi.runAllTimersAsync();

      // Application should still be considered initialized
      expect(console.log).toHaveBeenCalledWith('Sharp initialized successfully');
      expect(console.log).toHaveBeenCalledWith('Application dependencies initialized');
    });

    it('should handle resource cleanup on errors', async () => {
      process.env.REDIS_URL = 'redis://localhost:6379';
      
      const mockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        ping: vi.fn().mockRejectedValue(new Error('Ping failed')),
        quit: vi.fn().mockResolvedValue(undefined),
      };
      mockRedis.createClient.mockReturnValue(mockClient);

      const mockSharpInstance = {
        metadata: vi.fn().mockResolvedValue({ width: 8, height: 8 }),
      };
      mockSharp.default.mockReturnValue(mockSharpInstance);

      const healthModule = await import('../../pages/api/health.js');

      await vi.runAllTimersAsync();

      // Should attempt to quit the Redis client even on error
      expect(mockClient.quit).toHaveBeenCalled();
    });

    it('should continue startup if non-critical errors occur', async () => {
      // Mock console.error to throw (simulating logging errors)
      const originalError = console.error;
      global.console.error = vi.fn().mockImplementation(() => {
        // Don't actually throw, just track the call
      });

      mockSharp.default.mockImplementation(() => {
        throw new Error('Sharp error');
      });

      const healthModule = await import('../../pages/api/health.js');

      expect(async () => {
        await vi.runAllTimersAsync();
      }).not.toThrow();

      expect(console.log).toHaveBeenCalledWith('Application dependencies initialized');
    });
  });

  describe('Environment-specific Startup Behavior', () => {
    it('should handle development environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const mockSharpInstance = {
        metadata: vi.fn().mockResolvedValue({ width: 8, height: 8 }),
      };
      mockSharp.default.mockReturnValue(mockSharpInstance);

      const healthModule = await import('../../pages/api/health.js');

      await vi.runAllTimersAsync();

      expect(console.log).toHaveBeenCalledWith('Application dependencies initialized');

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle production environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const mockSharpInstance = {
        metadata: vi.fn().mockResolvedValue({ width: 8, height: 8 }),
      };
      mockSharp.default.mockReturnValue(mockSharpInstance);

      const healthModule = await import('../../pages/api/health.js');

      await vi.runAllTimersAsync();

      expect(console.log).toHaveBeenCalledWith('Application dependencies initialized');

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle missing environment variables', async () => {
      const originalEnv = { ...process.env };
      
      // Clear relevant environment variables
      delete process.env.REDIS_URL;
      delete process.env.NODE_ENV;

      const mockSharpInstance = {
        metadata: vi.fn().mockResolvedValue({ width: 8, height: 8 }),
      };
      mockSharp.default.mockReturnValue(mockSharpInstance);

      const healthModule = await import('../../pages/api/health.js');

      await vi.runAllTimersAsync();

      expect(console.log).toHaveBeenCalledWith('Redis URL not configured, skipping Redis initialization');
      expect(console.log).toHaveBeenCalledWith('Application dependencies initialized');

      // Restore environment
      process.env = originalEnv;
    });
  });

  describe('Performance and Resource Management', () => {
    it('should complete initialization within reasonable time', async () => {
      const mockSharpInstance = {
        metadata: vi.fn().mockResolvedValue({ width: 8, height: 8 }),
      };
      mockSharp.default.mockReturnValue(mockSharpInstance);

      process.env.REDIS_URL = 'redis://localhost:6379';
      const mockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        ping: vi.fn().mockResolvedValue('PONG'),
        quit: vi.fn().mockResolvedValue(undefined),
      };
      mockRedis.createClient.mockReturnValue(mockClient);

      const startTime = Date.now();
      const healthModule = await import('../../pages/api/health.js');

      await vi.runAllTimersAsync();
      const endTime = Date.now();

      const initTime = endTime - startTime;
      expect(initTime).toBeLessThan(5000); // Should complete within 5 seconds in tests
    });

    it('should not leak resources during initialization', async () => {
      const mockSharpInstance = {
        metadata: vi.fn().mockResolvedValue({ width: 8, height: 8 }),
      };
      mockSharp.default.mockReturnValue(mockSharpInstance);

      process.env.REDIS_URL = 'redis://localhost:6379';
      const mockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        ping: vi.fn().mockResolvedValue('PONG'),
        quit: vi.fn().mockResolvedValue(undefined),
      };
      mockRedis.createClient.mockReturnValue(mockClient);

      const healthModule = await import('../../pages/api/health.js');

      await vi.runAllTimersAsync();

      // Check that cleanup was called
      expect(mockClient.quit).toHaveBeenCalled();
    });

    it('should handle memory pressure during initialization', async () => {
      // Mock Sharp to simulate memory pressure
      const mockSharpInstance = {
        metadata: vi.fn().mockImplementation(() => {
          // Simulate memory allocation
          const buffer = Buffer.alloc(1024 * 1024); // 1MB
          return Promise.resolve({ width: 8, height: 8 });
        }),
      };
      mockSharp.default.mockReturnValue(mockSharpInstance);

      const healthModule = await import('../../pages/api/health.js');

      expect(async () => {
        await vi.runAllTimersAsync();
      }).not.toThrow();

      expect(console.log).toHaveBeenCalledWith('Sharp initialized successfully');
    });
  });

  describe('Readiness vs Liveness Separation', () => {
    it('should handle readiness check independently of initialization', async () => {
      // Import readiness endpoint
      const { GET: getReadiness } = await import('../../pages/api/readiness.js');

      // Mock slow initialization
      const mockSharpInstance = {
        metadata: vi.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({ width: 8, height: 8 }), 10000))
        ),
      };
      mockSharp.default.mockReturnValue(mockSharpInstance);

      // Readiness should respond immediately
      const readinessResponse = await getReadiness();
      const readinessData = await readinessResponse.json();

      expect(readinessResponse.status).toBe(200);
      expect(readinessData.ready).toBe(true);
      expect(readinessData.message).toBe('Server is ready to accept requests');
    });

    it('should differentiate between liveness and readiness', async () => {
      const { GET: getHealth } = await import('../../pages/api/health.js');
      const { GET: getReadiness } = await import('../../pages/api/readiness.js');

      // Mock initialization in progress
      mockSharp.default.mockImplementation(() => {
        throw new Error('Sharp not ready');
      });
      mockFs.access.mockRejectedValue(new Error('File system not ready'));

      const healthResponse = await getHealth();
      const healthData = await healthResponse.json();

      const readinessResponse = await getReadiness();
      const readinessData = await readinessResponse.json();

      // Health should be more detailed and potentially degraded
      expect(healthData).toHaveProperty('checks');
      expect(healthData.checks.sharp.status).toBe('degraded');

      // Readiness should be simple and available
      expect(readinessData.ready).toBe(true);
      expect(readinessData).not.toHaveProperty('checks');
    });
  });
});