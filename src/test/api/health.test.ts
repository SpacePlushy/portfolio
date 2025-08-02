import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock modules before importing the health endpoint
vi.mock('fs/promises', () => ({
  access: vi.fn(),
}));

vi.mock('sharp', () => ({
  default: vi.fn(),
}));

vi.mock('redis', () => ({
  createClient: vi.fn(),
}));

describe('Health Check Endpoint', () => {
  let mockFs: any;
  let mockSharp: any;
  let mockRedis: any;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();

    // Store original environment
    originalEnv = { ...process.env };

    // Setup module mocks
    mockFs = await vi.importMock('fs/promises');
    mockSharp = await vi.importMock('sharp');
    mockRedis = await vi.importMock('redis');

    // Mock process methods
    vi.spyOn(process, 'uptime').mockReturnValue(300);
    vi.spyOn(process, 'memoryUsage').mockReturnValue({
      rss: 104857600, // 100MB
      heapUsed: 52428800, // 50MB
      heapTotal: 83886080, // 80MB
      external: 10485760, // 10MB
      arrayBuffers: 5242880, // 5MB
    });

    // Reset globals
    vi.doUnmock('../../pages/api/health.js');
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('Basic Health Check', () => {
    it('should return healthy status for basic application check', async () => {
      // Mock successful filesystem check
      mockFs.access.mockResolvedValue(undefined);

      // Import after mocks are set up
      const { GET } = await import('../../pages/api/health.js');
      
      const mockContext = {
        url: new URL('http://localhost:4321/api/health')
      };
      
      const response = await GET(mockContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.checks.application.status).toBe('healthy');
      expect(data.checks.application.uptime).toBe(300);
      expect(data.checks.application.memory).toEqual({
        rss: 100,
        heapUsed: 50,
        heapTotal: 80,
        external: 10,
      });
    });

    it('should include environment information', async () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3000';
      process.env.HOST = 'localhost';

      mockFs.access.mockResolvedValue(undefined);

      const { GET } = await import('../../pages/api/health.js');
      
      const mockContext = {
        url: new URL('http://localhost:4321/api/health')
      };
      
      const response = await GET(mockContext);
      const data = await response.json();

      expect(data.checks.environment).toEqual({
        status: 'healthy',
        node_version: process.version,
        environment: 'test',
        port: '3000',
        host: 'localhost',
      });
    });

    it('should handle missing environment variables gracefully', async () => {
      delete process.env.NODE_ENV;
      delete process.env.PORT;
      delete process.env.HOST;

      mockFs.access.mockResolvedValue(undefined);

      const { GET } = await import('../../pages/api/health.js');
      
      const mockContext = {
        url: new URL('http://localhost:4321/api/health')
      };
      
      const response = await GET(mockContext);
      const data = await response.json();

      expect(data.checks.environment).toEqual({
        status: 'healthy',
        node_version: process.version,
        environment: 'production',
        port: 4321,
        host: '0.0.0.0',
      });
    });
  });

  describe('Sharp Integration Tests', () => {
    it('should report Sharp as healthy when properly initialized', async () => {
      // Mock successful Sharp initialization
      const mockSharpInstance = {
        metadata: vi.fn().mockResolvedValue({ width: 8, height: 8 }),
      };
      mockSharp.default.mockReturnValue(mockSharpInstance);

      mockFs.access.mockResolvedValue(undefined);

      // Wait for initialization to complete
      vi.runAllTimers();

      const { GET } = await import('../../pages/api/health.js');
      
      // Allow some time for async initialization
      await vi.runAllTimersAsync();

      const response = await GET();
      const data = await response.json();

      expect(data.checks.sharp.status).toBe('healthy');
      expect(data.checks.sharp.ready).toBe(true);
      expect(data.checks.sharp.message).toBe('Sharp image processing ready');
    });

    it('should report Sharp as degraded during initialization', async () => {
      mockFs.access.mockResolvedValue(undefined);

      // Import immediately without waiting for initialization
      const { GET } = await import('../../pages/api/health.js');
      
      const mockContext = {
        url: new URL('http://localhost:4321/api/health')
      };
      
      const response = await GET(mockContext);
      const data = await response.json();

      expect(data.checks.sharp.status).toBe('degraded');
      expect(data.checks.sharp.ready).toBe(false);
      expect(data.checks.sharp.message).toBe('Sharp initialization in progress');
    });

    it('should handle Sharp initialization failure gracefully', async () => {
      // Mock Sharp failure
      mockSharp.default.mockImplementation(() => {
        throw new Error('Sharp initialization failed');
      });

      mockFs.access.mockResolvedValue(undefined);

      const { GET } = await import('../../pages/api/health.js');
      
      // Wait for initialization attempt
      await vi.runAllTimersAsync();

      const response = await GET();
      const data = await response.json();

      expect(data.checks.sharp.status).toBe('degraded');
      expect(data.checks.sharp.ready).toBe(false);
    });

    it('should handle Sharp timeout during initialization', async () => {
      // Mock Sharp to hang
      const mockSharpInstance = {
        metadata: vi.fn().mockImplementation(() => new Promise(() => {})), // Never resolves
      };
      mockSharp.default.mockReturnValue(mockSharpInstance);

      mockFs.access.mockResolvedValue(undefined);

      const { GET } = await import('../../pages/api/health.js');
      
      // Fast-forward past timeout
      vi.advanceTimersByTime(6000);

      const response = await GET();
      const data = await response.json();

      expect(data.checks.sharp.status).toBe('degraded');
      expect(data.checks.sharp.ready).toBe(false);
    });
  });

  describe('Redis Integration Tests', () => {
    it('should report Redis as healthy when connected', async () => {
      process.env.REDIS_URL = 'redis://localhost:6379';

      // Mock successful Redis connection
      const mockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        ping: vi.fn().mockResolvedValue('PONG'),
        quit: vi.fn().mockResolvedValue(undefined),
      };
      mockRedis.createClient.mockReturnValue(mockClient);
      mockFs.access.mockResolvedValue(undefined);

      const { GET } = await import('../../pages/api/health.js');
      
      // Wait for Redis initialization
      await vi.runAllTimersAsync();

      const response = await GET();
      const data = await response.json();

      expect(data.checks.redis.status).toBe('healthy');
      expect(data.checks.redis.ready).toBe(true);
      expect(data.checks.redis.message).toBe('Redis connection ready');
      expect(data.checks.redis.url).toBe('redis://***@localhost:6379');
    });

    it('should report Redis as degraded when not configured', async () => {
      delete process.env.REDIS_URL;

      mockFs.access.mockResolvedValue(undefined);

      const { GET } = await import('../../pages/api/health.js');
      
      const mockContext = {
        url: new URL('http://localhost:4321/api/health')
      };
      
      const response = await GET(mockContext);
      const data = await response.json();

      expect(data.checks.redis.status).toBe('degraded');
      expect(data.checks.redis.ready).toBe(false);
      expect(data.checks.redis.message).toBe('Redis not configured');
    });

    it('should handle Redis connection failure gracefully', async () => {
      process.env.REDIS_URL = 'redis://localhost:6379';

      // Mock Redis connection failure
      const mockClient = {
        connect: vi.fn().mockRejectedValue(new Error('Connection refused')),
        quit: vi.fn().mockResolvedValue(undefined),
      };
      mockRedis.createClient.mockReturnValue(mockClient);
      mockFs.access.mockResolvedValue(undefined);

      const { GET } = await import('../../pages/api/health.js');
      
      // Wait for Redis initialization attempt
      await vi.runAllTimersAsync();

      const response = await GET();
      const data = await response.json();

      expect(data.checks.redis.status).toBe('degraded');
      expect(data.checks.redis.ready).toBe(false);
    });

    it('should handle Redis timeout during connection', async () => {
      process.env.REDIS_URL = 'redis://localhost:6379';

      // Mock Redis to hang during connect
      const mockClient = {
        connect: vi.fn().mockImplementation(() => new Promise(() => {})), // Never resolves
        quit: vi.fn().mockResolvedValue(undefined),
      };
      mockRedis.createClient.mockReturnValue(mockClient);
      mockFs.access.mockResolvedValue(undefined);

      const { GET } = await import('../../pages/api/health.js');
      
      // Fast-forward past timeout
      vi.advanceTimersByTime(6000);

      const response = await GET();
      const data = await response.json();

      expect(data.checks.redis.status).toBe('degraded');
      expect(data.checks.redis.ready).toBe(false);
    });

    it('should mask Redis credentials in URL', async () => {
      process.env.REDIS_URL = 'redis://user:password@localhost:6379/0';

      mockFs.access.mockResolvedValue(undefined);

      const { GET } = await import('../../pages/api/health.js');
      
      const mockContext = {
        url: new URL('http://localhost:4321/api/health')
      };
      
      const response = await GET(mockContext);
      const data = await response.json();

      expect(data.checks.redis.url).toBe('redis://user:***@localhost:6379/0');
    });
  });

  describe('Filesystem Tests', () => {
    it('should report filesystem as healthy when files are accessible', async () => {
      mockFs.access.mockResolvedValue(undefined);

      const { GET } = await import('../../pages/api/health.js');
      
      const mockContext = {
        url: new URL('http://localhost:4321/api/health')
      };
      
      const response = await GET(mockContext);
      const data = await response.json();

      expect(data.checks.filesystem.status).toBe('healthy');
      expect(data.checks.filesystem.message).toBe('Application files accessible');
      expect(mockFs.access).toHaveBeenCalledWith('./dist/server/entry.mjs');
    });

    it('should handle filesystem access failure gracefully', async () => {
      mockFs.access.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      const { GET } = await import('../../pages/api/health.js');
      
      const mockContext = {
        url: new URL('http://localhost:4321/api/health')
      };
      
      const response = await GET(mockContext);
      const data = await response.json();

      expect(data.checks.filesystem.status).toBe('degraded');
      expect(data.checks.filesystem.message).toBe('Application files check failed');
      expect(data.checks.filesystem.error).toBe('ENOENT: no such file or directory');
    });

    it('should handle filesystem check timeout', async () => {
      // Mock fs.access to hang
      mockFs.access.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { GET } = await import('../../pages/api/health.js');
      
      // Fast-forward past timeout
      vi.advanceTimersByTime(3000);

      const response = await GET();
      const data = await response.json();

      expect(data.checks.filesystem.status).toBe('degraded');
      expect(data.checks.filesystem.message).toBe('File system check timeout');
      expect(data.checks.filesystem.timeout).toBe(true);
    });
  });

  describe('Startup Behavior Tests', () => {
    it('should be lenient during startup period (first 60 seconds)', async () => {
      // Mock Sharp and Redis as degraded
      mockFs.access.mockRejectedValue(new Error('Not ready'));

      const { GET } = await import('../../pages/api/health.js');
      
      // Simulate early startup (within 60 seconds)
      vi.spyOn(Date, 'now').mockReturnValue(1000); // Very early in startup

      const response = await GET();
      const data = await response.json();

      // Should still return 200 during startup
      expect(response.status).toBe(200);
      expect(data.startup_time_seconds).toBeLessThan(60);
    });

    it('should be strict after startup period', async () => {
      mockFs.access.mockRejectedValue(new Error('Critical failure'));

      const { GET } = await import('../../pages/api/health.js');
      
      // Simulate well after startup (beyond 60 seconds)
      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 120000); // 2 minutes after startup

      const response = await GET();
      const data = await response.json();

      expect(data.status).toBe('unhealthy');
      expect(data.startup_time_seconds).toBeGreaterThan(60);
    });

    it('should handle errors gracefully during startup', async () => {
      // Mock an error during health check execution
      mockFs.access.mockImplementation(() => {
        throw new Error('Unexpected error during startup');
      });

      const { GET } = await import('../../pages/api/health.js');
      
      // Simulate startup period
      vi.spyOn(Date, 'now').mockReturnValue(1000);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200); // Still returns 200 during startup
      expect(data.status).toBe('degraded');
      expect(data.checks.startup_error).toBeDefined();
      expect(data.checks.startup_error.message).toBe('Startup in progress');
    });

    it('should report errors normally after startup period', async () => {
      mockFs.access.mockImplementation(() => {
        throw new Error('Critical system error');
      });

      const { GET } = await import('../../pages/api/health.js');
      
      // Simulate well after startup
      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 120000);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.status).toBe('unhealthy');
      expect(data.checks.error).toBeDefined();
      expect(data.checks.error.message).toBe('Critical system error');
    });
  });

  describe('Response Format Tests', () => {
    it('should include all required response fields', async () => {
      mockFs.access.mockResolvedValue(undefined);

      const { GET } = await import('../../pages/api/health.js');
      
      const mockContext = {
        url: new URL('http://localhost:4321/api/health')
      };
      
      const response = await GET(mockContext);
      const data = await response.json();

      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('response_time_ms');
      expect(data).toHaveProperty('startup_time_seconds');
      expect(data).toHaveProperty('checks');

      expect(typeof data.response_time_ms).toBe('number');
      expect(typeof data.startup_time_seconds).toBe('number');
      expect(typeof data.timestamp).toBe('string');
      expect(new Date(data.timestamp)).toBeInstanceOf(Date);
    });

    it('should have proper cache control headers', async () => {
      mockFs.access.mockResolvedValue(undefined);

      const { GET } = await import('../../pages/api/health.js');
      
      const mockContext = {
        url: new URL('http://localhost:4321/api/health')
      };
      
      const response = await GET(mockContext);

      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    });

    it('should include version information when available', async () => {
      process.env.npm_package_version = '2.1.0';
      mockFs.access.mockResolvedValue(undefined);

      const { GET } = await import('../../pages/api/health.js');
      
      const mockContext = {
        url: new URL('http://localhost:4321/api/health')
      };
      
      const response = await GET(mockContext);
      const data = await response.json();

      expect(data.checks.application.version).toBe('2.1.0');
    });

    it('should use default version when not available', async () => {
      delete process.env.npm_package_version;
      mockFs.access.mockResolvedValue(undefined);

      const { GET } = await import('../../pages/api/health.js');
      
      const mockContext = {
        url: new URL('http://localhost:4321/api/health')
      };
      
      const response = await GET(mockContext);
      const data = await response.json();

      expect(data.checks.application.version).toBe('1.0.0');
    });
  });

  describe('Performance Tests', () => {
    it('should respond quickly under normal conditions', async () => {
      mockFs.access.mockResolvedValue(undefined);

      const { GET } = await import('../../pages/api/health.js');
      
      const startTime = Date.now();
      const response = await GET();
      const endTime = Date.now();
      const data = await response.json();

      const actualResponseTime = endTime - startTime;
      expect(actualResponseTime).toBeLessThan(100); // Should be very fast in tests
      expect(data.response_time_ms).toBeGreaterThan(0);
    });

    it('should handle concurrent health check requests', async () => {
      mockFs.access.mockResolvedValue(undefined);

      const { GET } = await import('../../pages/api/health.js');
      
      // Make multiple concurrent requests
      const promises = Array(10).fill(null).map(() => GET());
      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Parse all responses
      const data = await Promise.all(responses.map(r => r.json()));
      data.forEach(d => {
        expect(d.status).toBe('healthy');
      });
    });
  });
});