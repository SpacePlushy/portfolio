import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock process methods
const mockProcess = {
  uptime: vi.fn(),
  memoryUsage: vi.fn()
};

// Mock global process object
global.process = {
  ...global.process,
  uptime: mockProcess.uptime,
  memoryUsage: mockProcess.memoryUsage
} as any;

describe('Monitoring API Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    
    // Setup default mock implementations
    mockProcess.uptime.mockReturnValue(3600); // 1 hour uptime
    mockProcess.memoryUsage.mockReturnValue({
      rss: 104857600, // 100MB
      heapUsed: 52428800, // 50MB
      heapTotal: 83886080, // 80MB
      external: 10485760, // 10MB
      arrayBuffers: 5242880 // 5MB
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Monitoring Response', () => {
    it('should return monitoring data with correct structure', async () => {
      const { GET } = await import('../../pages/api/monitoring.js');
      
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');

      // Check all required fields are present
      expect(data).toHaveProperty('requestCount');
      expect(data).toHaveProperty('rateLimitHits');
      expect(data).toHaveProperty('botDetections');
      expect(data).toHaveProperty('suspiciousBots');
      expect(data).toHaveProperty('allowedBots');
      expect(data).toHaveProperty('averageResponseTime');
      expect(data).toHaveProperty('errorRate');
      expect(data).toHaveProperty('uptime');
      expect(data).toHaveProperty('memoryUsage');
      expect(data).toHaveProperty('topPaths');
      expect(data).toHaveProperty('topUserAgents');
      expect(data).toHaveProperty('recentEvents');
    });

    it('should return reasonable metric values', async () => {
      const { GET } = await import('../../pages/api/monitoring.js');
      
      const response = await GET();
      const data = await response.json();

      // Validate metric ranges
      expect(data.requestCount).toBeGreaterThanOrEqual(5000);
      expect(data.requestCount).toBeLessThanOrEqual(15000);
      
      expect(data.rateLimitHits).toBeGreaterThanOrEqual(10);
      expect(data.rateLimitHits).toBeLessThanOrEqual(60);
      
      expect(data.botDetections).toBeGreaterThanOrEqual(50);
      expect(data.botDetections).toBeLessThanOrEqual(250);
      
      expect(data.suspiciousBots).toBeGreaterThanOrEqual(5);
      expect(data.suspiciousBots).toBeLessThanOrEqual(25);
      
      expect(data.allowedBots).toBeGreaterThanOrEqual(30);
      expect(data.allowedBots).toBeLessThanOrEqual(130);
      
      expect(data.averageResponseTime).toBeGreaterThanOrEqual(50);
      expect(data.averageResponseTime).toBeLessThanOrEqual(150);
      
      expect(data.errorRate).toBeGreaterThanOrEqual(0);
      expect(data.errorRate).toBeLessThanOrEqual(2);
    });

    it('should include system information', async () => {
      const { GET } = await import('../../pages/api/monitoring.js');
      
      const response = await GET();
      const data = await response.json();

      expect(data.uptime).toBe(3600); // Matches mocked uptime
      expect(data.memoryUsage).toEqual({
        rss: 100, // Converted from bytes to MB
        heapUsed: 50,
        heapTotal: 80,
        external: 10
      });
    });
  });

  describe('Top Paths Metrics', () => {
    it('should return array of top paths with required fields', async () => {
      const { GET } = await import('../../pages/api/monitoring.js');
      
      const response = await GET();
      const data = await response.json();

      expect(Array.isArray(data.topPaths)).toBe(true);
      expect(data.topPaths.length).toBeGreaterThan(0);

      data.topPaths.forEach((pathData: any) => {
        expect(pathData).toHaveProperty('path');
        expect(pathData).toHaveProperty('count');
        expect(pathData).toHaveProperty('avgResponseTime');
        expect(typeof pathData.path).toBe('string');
        expect(typeof pathData.count).toBe('number');
        expect(typeof pathData.avgResponseTime).toBe('number');
        expect(pathData.count).toBeGreaterThan(0);
        expect(pathData.avgResponseTime).toBeGreaterThan(0);
      });
    });

    it('should include expected common paths', async () => {
      const { GET } = await import('../../pages/api/monitoring.js');
      
      const response = await GET();
      const data = await response.json();

      const paths = data.topPaths.map((p: any) => p.path);
      expect(paths).toContain('/');
      expect(paths).toContain('/software-engineer');
      expect(paths).toContain('/customer-service');
      expect(paths).toContain('/api/health');
      expect(paths).toContain('/health-status');
    });

    it('should have reasonable response time values', async () => {
      const { GET } = await import('../../pages/api/monitoring.js');
      
      const response = await GET();
      const data = await response.json();

      data.topPaths.forEach((pathData: any) => {
        expect(pathData.avgResponseTime).toBeGreaterThanOrEqual(5);
        expect(pathData.avgResponseTime).toBeLessThanOrEqual(250);
        
        // Health check should be faster than other endpoints
        if (pathData.path === '/api/health') {
          expect(pathData.avgResponseTime).toBeLessThanOrEqual(25);
        }
      });
    });
  });

  describe('Top User Agents Metrics', () => {
    it('should return array of user agents with classifications', async () => {
      const { GET } = await import('../../pages/api/monitoring.js');
      
      const response = await GET();
      const data = await response.json();

      expect(Array.isArray(data.topUserAgents)).toBe(true);
      expect(data.topUserAgents.length).toBeGreaterThan(0);

      data.topUserAgents.forEach((uaData: any) => {
        expect(uaData).toHaveProperty('userAgent');
        expect(uaData).toHaveProperty('count');
        expect(uaData).toHaveProperty('classification');
        expect(typeof uaData.userAgent).toBe('string');
        expect(typeof uaData.count).toBe('number');
        expect(typeof uaData.classification).toBe('string');
        expect(['human', 'bot', 'suspicious']).toContain(uaData.classification);
        expect(uaData.count).toBeGreaterThan(0);
      });
    });

    it('should include realistic user agent strings', async () => {
      const { GET } = await import('../../pages/api/monitoring.js');
      
      const response = await GET();
      const data = await response.json();

      const userAgents = data.topUserAgents.map((ua: any) => ua.userAgent);
      
      // Should have some browser user agents
      const hasBrowserUA = userAgents.some((ua: string) => ua.includes('Mozilla') || ua.includes('Chrome') || ua.includes('Safari'));
      expect(hasBrowserUA).toBe(true);
      
      // Should have some bot user agents
      const hasBotUA = userAgents.some((ua: string) => ua.includes('bot') || ua.includes('Googlebot') || ua.includes('bingbot'));
      expect(hasBotUA).toBe(true);
    });

    it('should have proper classification distribution', async () => {
      const { GET } = await import('../../pages/api/monitoring.js');
      
      const response = await GET();
      const data = await response.json();

      const classifications = data.topUserAgents.map((ua: any) => ua.classification);
      
      // Should have a mix of classifications
      expect(classifications).toContain('human');
      expect(classifications).toContain('bot');
      
      // Human traffic should typically be highest
      const humanCount = classifications.filter((c: string) => c === 'human').length;
      expect(humanCount).toBeGreaterThan(0);
    });
  });

  describe('Recent Events', () => {
    it('should return array of recent security events', async () => {
      const { GET } = await import('../../pages/api/monitoring.js');
      
      const response = await GET();
      const data = await response.json();

      expect(Array.isArray(data.recentEvents)).toBe(true);
      expect(data.recentEvents.length).toBeGreaterThan(0);

      data.recentEvents.forEach((event: any) => {
        expect(event).toHaveProperty('timestamp');
        expect(event).toHaveProperty('type');
        expect(event).toHaveProperty('ip');
        expect(event).toHaveProperty('path');
        expect(event).toHaveProperty('details');
        
        expect(typeof event.timestamp).toBe('string');
        expect(typeof event.type).toBe('string');
        expect(typeof event.ip).toBe('string');
        expect(typeof event.path).toBe('string');
        expect(typeof event.details).toBe('object');
        
        // Validate timestamp format
        expect(new Date(event.timestamp)).toBeInstanceOf(Date);
        expect(new Date(event.timestamp).toISOString()).toBe(event.timestamp);
      });
    });

    it('should include different types of security events', async () => {
      const { GET } = await import('../../pages/api/monitoring.js');
      
      const response = await GET();
      const data = await response.json();

      const eventTypes = data.recentEvents.map((event: any) => event.type);
      
      // Should have various event types
      const uniqueTypes = [...new Set(eventTypes)];
      expect(uniqueTypes.length).toBeGreaterThan(1);
      
      // Common event types that should appear
      const hasRateLimit = eventTypes.includes('rate_limit');
      const hasBotDetection = eventTypes.includes('bot_detection');
      const hasSuspiciousActivity = eventTypes.includes('suspicious_activity');
      
      expect(hasRateLimit || hasBotDetection || hasSuspiciousActivity).toBe(true);
    });

    it('should have reasonable event details', async () => {
      const { GET } = await import('../../pages/api/monitoring.js');
      
      const response = await GET();
      const data = await response.json();

      data.recentEvents.forEach((event: any) => {
        // Validate IP address format (basic check)
        expect(event.ip).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
        
        // Validate path format
        expect(event.path).toMatch(/^\/.*$/);
        
        // Event-specific detail validation
        if (event.type === 'rate_limit') {
          expect(event.details).toHaveProperty('limit');
          expect(event.details).toHaveProperty('current');
          expect(typeof event.details.limit).toBe('number');
          expect(typeof event.details.current).toBe('number');
          expect(event.details.current).toBeGreaterThan(event.details.limit);
        }
        
        if (event.type === 'bot_detection') {
          expect(event.details).toHaveProperty('confidence');
          expect(event.details).toHaveProperty('signals');
          expect(typeof event.details.confidence).toBe('number');
          expect(Array.isArray(event.details.signals)).toBe(true);
          expect(event.details.confidence).toBeGreaterThanOrEqual(0);
          expect(event.details.confidence).toBeLessThanOrEqual(100);
        }
        
        if (event.type === 'suspicious_activity') {
          expect(event.details).toHaveProperty('rapidRequests');
          expect(event.details).toHaveProperty('uniquePaths');
          expect(typeof event.details.rapidRequests).toBe('number');
          expect(typeof event.details.uniquePaths).toBe('number');
          expect(event.details.rapidRequests).toBeGreaterThan(0);
          expect(event.details.uniquePaths).toBeGreaterThan(0);
        }
      });
    });

    it('should have recent timestamps', async () => {
      const { GET } = await import('../../pages/api/monitoring.js');
      
      const response = await GET();
      const data = await response.json();

      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);

      data.recentEvents.forEach((event: any) => {
        const eventTime = new Date(event.timestamp).getTime();
        expect(eventTime).toBeGreaterThanOrEqual(oneHourAgo);
        expect(eventTime).toBeLessThanOrEqual(now);
      });
    });
  });

  describe('Memory Usage Conversion', () => {
    it('should convert memory usage from bytes to MB correctly', async () => {
      mockProcess.memoryUsage.mockReturnValue({
        rss: 209715200, // 200MB in bytes
        heapUsed: 104857600, // 100MB in bytes
        heapTotal: 157286400, // 150MB in bytes
        external: 20971520, // 20MB in bytes
        arrayBuffers: 10485760 // 10MB in bytes
      });

      const { GET } = await import('../../pages/api/monitoring.js');
      
      const response = await GET();
      const data = await response.json();

      expect(data.memoryUsage.rss).toBe(200);
      expect(data.memoryUsage.heapUsed).toBe(100);
      expect(data.memoryUsage.heapTotal).toBe(150);
      expect(data.memoryUsage.external).toBe(20);
    });

    it('should handle edge case memory values', async () => {
      mockProcess.memoryUsage.mockReturnValue({
        rss: 0,
        heapUsed: 1024 * 1024, // 1MB
        heapTotal: 1024 * 1024 * 1024, // 1GB
        external: 512, // Less than 1KB
        arrayBuffers: 0
      });

      const { GET } = await import('../../pages/api/monitoring.js');
      
      const response = await GET();
      const data = await response.json();

      expect(data.memoryUsage.rss).toBe(0);
      expect(data.memoryUsage.heapUsed).toBe(1);
      expect(data.memoryUsage.heapTotal).toBe(1024);
      expect(data.memoryUsage.external).toBe(0); // Rounds down from < 1MB
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      // Mock process.uptime to throw an error
      mockProcess.uptime.mockImplementation(() => {
        throw new Error('Process error');
      });

      const { GET } = await import('../../pages/api/monitoring.js');
      
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(data.error).toBe('Failed to fetch monitoring metrics');
      expect(data.message).toBe('Process error');
    });

    it('should handle memory usage errors', async () => {
      mockProcess.memoryUsage.mockImplementation(() => {
        throw new Error('Memory usage error');
      });

      const { GET } = await import('../../pages/api/monitoring.js');
      
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch monitoring metrics');
    });

    it('should return proper error headers', async () => {
      mockProcess.uptime.mockImplementation(() => {
        throw new Error('Test error');
      });

      const { GET } = await import('../../pages/api/monitoring.js');
      
      const response = await GET();

      expect(response.status).toBe(500);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('Performance Tests', () => {
    it('should respond quickly under normal conditions', async () => {
      const { GET } = await import('../../pages/api/monitoring.js');
      
      const startTime = Date.now();
      const response = await GET();
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(100); // Should be fast
      expect(response.status).toBe(200);
    });

    it('should handle concurrent requests', async () => {
      const { GET } = await import('../../pages/api/monitoring.js');
      
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
        expect(d).toHaveProperty('requestCount');
        expect(d).toHaveProperty('uptime');
        expect(d).toHaveProperty('memoryUsage');
      });
    });
  });

  describe('Data Consistency', () => {
    it('should have consistent data relationships', async () => {
      const { GET } = await import('../../pages/api/monitoring.js');
      
      const response = await GET();
      const data = await response.json();

      // Bot detection totals should make sense (allowing for some variance in mock data)
      expect(data.botDetections).toBeGreaterThanOrEqual(Math.min(data.suspiciousBots, data.allowedBots));
      
      // Memory usage should be reasonable
      expect(data.memoryUsage.heapUsed).toBeLessThanOrEqual(data.memoryUsage.heapTotal);
      expect(data.memoryUsage.rss).toBeGreaterThanOrEqual(data.memoryUsage.heapUsed);
      
      // Error rate should be a percentage
      expect(data.errorRate).toBeGreaterThanOrEqual(0);
      expect(data.errorRate).toBeLessThanOrEqual(100);
      
      // Response time should be positive
      expect(data.averageResponseTime).toBeGreaterThan(0);
    });

    it('should have realistic proportions', async () => {
      const { GET } = await import('../../pages/api/monitoring.js');
      
      const response = await GET();
      const data = await response.json();

      // Request count should be much higher than bot detections
      expect(data.requestCount).toBeGreaterThan(data.botDetections);
      
      // Allowed bots should typically be more than suspicious bots
      expect(data.allowedBots).toBeGreaterThanOrEqual(data.suspiciousBots * 0.5);
      
      // Rate limit hits should be less than total requests
      expect(data.rateLimitHits).toBeLessThan(data.requestCount);
    });
  });

  describe('Response Format Validation', () => {
    it('should return properly formatted JSON', async () => {
      const { GET } = await import('../../pages/api/monitoring.js');
      
      const response = await GET();
      const text = await response.text();

      // Should be valid JSON
      expect(() => JSON.parse(text)).not.toThrow();
      
      // Should be properly formatted (includes newlines from JSON.stringify(null, 2))
      expect(text).toContain('\n');
      expect(text).toContain('  '); // Indentation
    });

    it('should have consistent array lengths', async () => {
      const { GET } = await import('../../pages/api/monitoring.js');
      
      const response = await GET();
      const data = await response.json();

      // Arrays should have reasonable lengths
      expect(data.topPaths.length).toBeGreaterThanOrEqual(3);
      expect(data.topPaths.length).toBeLessThanOrEqual(10);
      
      expect(data.topUserAgents.length).toBeGreaterThanOrEqual(3);
      expect(data.topUserAgents.length).toBeLessThanOrEqual(10);
      
      expect(data.recentEvents.length).toBeGreaterThanOrEqual(1);
      expect(data.recentEvents.length).toBeLessThanOrEqual(10);
    });
  });
});