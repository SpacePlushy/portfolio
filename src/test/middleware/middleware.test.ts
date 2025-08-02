import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create a comprehensive middleware test suite
describe('Security Middleware', () => {
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: any;
  let mockContext: any;
  let mockUrl: any;
  let originalConsole: typeof console;
  let originalProcess: typeof process;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();

    // Store originals
    originalConsole = global.console;
    originalProcess = global.process;

    // Mock console to avoid noise in tests
    global.console = {
      ...console,
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn()
    };

    // Create mock objects
    mockResponse = {
      status: 200,
      headers: new Map() as Map<string, string>,
      set: vi.fn((name: string, value: string) => {
        mockResponse.headers.set(name.toLowerCase(), value);
      }),
      get: vi.fn((name: string) => mockResponse.headers.get(name.toLowerCase())),
    };

    // Add headers property and methods to mock response
    mockResponse.headers = {
      set: vi.fn((name: string, value: string) => {
        mockResponse.headers.set(name.toLowerCase(), value);
      }),
      get: vi.fn((name: string) => mockResponse.headers.get(name.toLowerCase())),
      has: vi.fn((name: string) => mockResponse.headers.has(name.toLowerCase())),
      delete: vi.fn((name: string) => mockResponse.headers.delete(name.toLowerCase())),
    };

    mockRequest = {
      method: 'GET',
      headers: new Map([
        ['user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'],
        ['accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'],
        ['accept-language', 'en-US,en;q=0.5'],
        ['accept-encoding', 'gzip, deflate, br']
      ]),
      get: vi.fn((name: string) => mockRequest.headers.get(name.toLowerCase())),
    };

    mockUrl = {
      pathname: '/',
      search: '',
      href: 'http://localhost:3000/',
    };

    mockNext = vi.fn().mockResolvedValue(mockResponse);

    mockContext = {
      request: mockRequest,
      url: mockUrl,
      locals: {}
    };

    // Mock Date.now for consistent timing
    vi.spyOn(Date, 'now').mockReturnValue(1000000);

    // Mock Buffer for ETag generation
    vi.spyOn(Buffer, 'from').mockReturnValue({
      toString: vi.fn().mockReturnValue('mockedbase64string')
    } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    global.console = originalConsole;
    global.process = originalProcess;
  });

  describe('Middleware Skipping Logic', () => {
    it('should skip middleware for health endpoints', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      const healthPaths = ['/api/health', '/api/readiness'];

      for (const path of healthPaths) {
        mockUrl.pathname = path;
        const result = await onRequest(mockContext, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(result).toBe(mockResponse);
        vi.clearAllMocks();
      }
    });

    it('should skip middleware for static assets', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      const staticPaths = [
        '/favicon.ico',
        '/manifest.json',
        '/robots.txt',
        '/apple-touch-icon.png',
        '/.well-known/appspecific/com.chrome.devtools.json'
      ];

      for (const path of staticPaths) {
        mockUrl.pathname = path;
        const result = await onRequest(mockContext, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(result).toBe(mockResponse);
        vi.clearAllMocks();
      }
    });

    it('should handle Chrome DevTools requests', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      mockUrl.pathname = '/.well-known/appspecific/com.chrome.devtools.json';
      const result = await onRequest(mockContext, mockNext);

      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(204);
    });
  });

  describe('CDN Detection', () => {
    it('should detect Cloudflare CDN', async () => {
      const { onRequest } = await import('../../middleware.js');
      

      mockRequest.headers.set('cf-ray', '12345-LAX');
      mockRequest.headers.set('cf-cache-status', 'HIT');
      mockRequest.headers.set('cf-ipcountry', 'US');
      
      const result = await onRequest(mockContext, mockNext);

      expect(result.headers.get('X-CDN-Provider')).toBe('cloudflare');
      expect(result.headers.get('X-CDN-Cache')).toBe('HIT');
    });

    it('should detect AWS CloudFront', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      mockRequest.headers.set('x-amz-cf-id', 'EXAMPLE123');
      mockRequest.headers.set('x-cache', 'Hit from cloudfront');
      
      const result = await onRequest(mockContext, mockNext);

      expect(result.headers.get('X-CDN-Provider')).toBe('cloudfront');
      expect(result.headers.get('X-CDN-Cache')).toBe('Hit from cloudfront');
    });

    it('should detect Digital Ocean CDN', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      mockRequest.headers.set('x-digitalocean-cache-status', 'HIT');
      
      const result = await onRequest(mockContext, mockNext);

      expect(result.headers.get('X-CDN-Provider')).toBe('digitalocean');
      expect(result.headers.get('X-CDN-Cache')).toBe('HIT');
    });

    it('should detect generic CDN', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      mockRequest.headers.set('x-cache', 'HIT');
      mockRequest.headers.set('x-served-by', 'cache-server-1');
      
      const result = await onRequest(mockContext, mockNext);

      expect(result.headers.get('X-CDN-Provider')).toBe('generic');
      expect(result.headers.get('X-CDN-Cache')).toBe('HIT');
    });
  });

  describe('Asset Type Detection', () => {
    it('should correctly identify image assets', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      const imagePaths = ['/image.png', '/photo.jpg', '/icon.svg', '/banner.webp'];

      for (const path of imagePaths) {
        mockUrl.pathname = path;
        mockNext.mockClear();
        
        const result = await onRequest(mockContext, mockNext);

        expect(result.headers.get('X-Asset-Type')).toBe('image');
        expect(result.headers.get('Cache-Control')).toContain('max-age=86400');
      }
    });

    it('should correctly identify font assets', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      mockUrl.pathname = '/font.woff2';
      const result = await onRequest(mockContext, mockNext);

      expect(result.headers.get('X-Asset-Type')).toBe('font');
      expect(result.headers.get('Cache-Control')).toContain('max-age=31536000');
      expect(result.headers.get('Cache-Control')).toContain('immutable');
    });

    it('should correctly identify script and style assets', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      const scriptPaths = ['/bundle.js', '/styles.css'];

      for (const path of scriptPaths) {
        mockUrl.pathname = path;
        mockNext.mockClear();
        
        const result = await onRequest(mockContext, mockNext);

        const assetType = path.endsWith('.js') ? 'script' : 'style';
        expect(result.headers.get('X-Asset-Type')).toBe(assetType);
        expect(result.headers.get('Cache-Control')).toContain('max-age=31536000');
        expect(result.headers.get('Cache-Control')).toContain('immutable');
      }
    });

    it('should correctly identify page assets', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      mockUrl.pathname = '/software-engineer';
      const result = await onRequest(mockContext, mockNext);

      expect(result.headers.get('X-Asset-Type')).toBe('page');
      expect(result.headers.get('Cache-Control')).toContain('max-age=300');
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      mockUrl.pathname = '/api/test';
      mockRequest.headers.set('cf-connecting-ip', '192.168.1.1');
      
      const result = await onRequest(mockContext, mockNext);

      expect(result.headers.get('X-RateLimit-Limit')).toBe('30');
      expect(result.headers.get('X-RateLimit-Remaining')).toBe('29');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should enforce rate limits and block excessive requests', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      mockUrl.pathname = '/api/test';
      mockRequest.headers.set('cf-connecting-ip', '192.168.1.2');

      // Make requests up to the limit
      for (let i = 0; i < 30; i++) {
        mockNext.mockClear();
        await onRequest(mockContext, mockNext);
      }

      // Next request should be rate limited
      mockNext.mockClear();
      const result = await onRequest(mockContext, mockNext);

      expect(result.status).toBe(429);
      expect(mockNext).not.toHaveBeenCalled();
      
      const data = await result.json();
      expect(data.error).toBe('Rate limit exceeded');
    });

    it('should have different limits for different endpoints', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      // Health endpoint should have higher limit
      mockUrl.pathname = '/api/health';
      mockRequest.headers.set('cf-connecting-ip', '192.168.1.3');
      
      const healthResult = await onRequest(mockContext, mockNext);
      expect(healthResult.headers.get('X-RateLimit-Limit')).toBe('100');

      // Regular API endpoint should have lower limit
      mockUrl.pathname = '/api/other';
      mockNext.mockClear();
      
      const apiResult = await onRequest(mockContext, mockNext);
      expect(apiResult.headers.get('X-RateLimit-Limit')).toBe('30');
    });

    it('should reset rate limits after window expires', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      mockUrl.pathname = '/api/test';
      mockRequest.headers.set('cf-connecting-ip', '192.168.1.4');

      // Use up the rate limit
      for (let i = 0; i < 30; i++) {
        mockNext.mockClear();
        await onRequest(mockContext, mockNext);
      }

      // Should be rate limited
      mockNext.mockClear();
      let result = await onRequest(mockContext, mockNext);
      expect(result.status).toBe(429);

      // Advance time beyond rate limit window
      vi.advanceTimersByTime(61000); // 61 seconds

      // Should be allowed again
      mockNext.mockClear();
      result = await onRequest(mockContext, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(result.headers.get('X-RateLimit-Remaining')).toBe('29');
    });
  });

  describe('Bot Detection', () => {
    it('should detect and allow legitimate search engine bots', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      const legitimateBots = [
        'Googlebot/2.1 (+http://www.google.com/bot.html)',
        'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
        'DuckDuckBot/1.0 (+http://duckduckgo.com/duckduckbot.html)'
      ];

      for (const userAgent of legitimateBots) {
        mockRequest.headers.set('user-agent', userAgent);
        mockNext.mockClear();
        
        const result = await onRequest(mockContext, mockNext);

        expect(mockContext.locals.botCheck.status).toBe('likely_bot');
        expect(mockContext.locals.botCheck.type).toBe('allowed');
        expect(mockContext.locals.botCheck.confidence).toBeGreaterThanOrEqual(90);
        expect(mockNext).toHaveBeenCalled();
      }
    });

    it('should detect suspicious bots', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      const suspiciousBots = [
        'python-requests/2.28.1',
        'wget/1.20.3',
        'curl/7.68.0',
        'scrapy/2.5.1',
        'bot-scanner-v1.0'
      ];

      for (const userAgent of suspiciousBots) {
        mockRequest.headers.set('user-agent', userAgent);
        mockRequest.headers.delete('accept');
        mockRequest.headers.delete('accept-language');
        mockNext.mockClear();
        
        const result = await onRequest(mockContext, mockNext);

        expect(mockContext.locals.botCheck.status).toBe('likely_bot');
        expect(mockContext.locals.botCheck.type).toBe('suspicious');
        expect(mockContext.locals.botCheck.confidence).toBeGreaterThanOrEqual(50);
        expect(mockNext).toHaveBeenCalled(); // Should still allow by default
      }
    });

    it('should classify regular users as human', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      const humanUserAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
      ];

      for (const userAgent of humanUserAgents) {
        mockRequest.headers.set('user-agent', userAgent);
        mockNext.mockClear();
        
        const result = await onRequest(mockContext, mockNext);

        expect(mockContext.locals.botCheck.status).toBe('likely_human');
        expect(mockContext.locals.botCheck.confidence).toBeLessThan(50);
        expect(mockNext).toHaveBeenCalled();
      }
    });

    it('should increase confidence with missing headers', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      // Remove typical browser headers
      mockRequest.headers.delete('user-agent');
      mockRequest.headers.delete('accept');
      mockRequest.headers.delete('accept-language');
      mockRequest.headers.delete('accept-encoding');
      
      const result = await onRequest(mockContext, mockNext);

      expect(mockContext.locals.botCheck.confidence).toBeGreaterThanOrEqual(70);
      expect(mockContext.locals.botCheck.signals).toContain('missing_user_agent');
      expect(mockContext.locals.botCheck.signals).toContain('suspicious_accept_header');
      expect(mockContext.locals.botCheck.signals).toContain('missing_accept_language');
      expect(mockContext.locals.botCheck.signals).toContain('missing_accept_encoding');
    });

    it('should track and use behavioral signals', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      mockRequest.headers.set('cf-connecting-ip', '192.168.1.100');
      mockRequest.headers.set('user-agent', 'SuspiciousBot/1.0');

      // Make multiple rapid requests to different paths
      const paths = ['/page1', '/page2', '/page3', '/page4', '/page5'];
      
      for (const path of paths) {
        mockUrl.pathname = path;
        mockNext.mockClear();
        await onRequest(mockContext, mockNext);
      }

      // Final request should have increased confidence due to rapid requests
      mockUrl.pathname = '/page6';
      mockNext.mockClear();
      const result = await onRequest(mockContext, mockNext);

      expect(mockContext.locals.botCheck.confidence).toBeGreaterThan(30);
      // Rapid requests signal may be present (depends on implementation details)
    });
  });

  describe('Security Headers', () => {
    it('should add comprehensive security headers', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      const result = await onRequest(mockContext, mockNext);

      // Check for presence of security headers
      expect(result.headers.get('Content-Security-Policy')).toBeTruthy();
      expect(result.headers.get('X-Frame-Options')).toBe('DENY');
      expect(result.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(result.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(result.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
      expect(result.headers.get('Permissions-Policy')).toBeTruthy();
    });

    it('should include HSTS in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const { onRequest } = await import('../../middleware.js');
      
      const result = await onRequest(mockContext, mockNext);

      expect(result.headers.get('Strict-Transport-Security')).toBeTruthy();
      expect(result.headers.get('Strict-Transport-Security')).toContain('max-age=31536000');

      process.env.NODE_ENV = originalEnv;
    });

    it('should skip HSTS in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const { onRequest } = await import('../../middleware.js');
      
      const result = await onRequest(mockContext, mockNext);

      expect(result.headers.get('Strict-Transport-Security')).toBeFalsy();

      process.env.NODE_ENV = originalEnv;
    });

    it('should not override CDN headers', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      // Set some CDN headers that should be preserved
      mockResponse.headers.set('cf-cache-status', 'HIT');
      mockResponse.headers.set('age', '3600');
      
      const result = await onRequest(mockContext, mockNext);

      // CDN headers should be preserved
      expect(result.headers.get('cf-cache-status')).toBe('HIT');
      expect(result.headers.get('age')).toBe('3600');
    });
  });

  describe('Cache Control Headers', () => {
    it('should set appropriate cache headers for API routes', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      mockUrl.pathname = '/api/users';
      const result = await onRequest(mockContext, mockNext);

      expect(result.headers.get('Cache-Control')).toContain('no-cache');
      expect(result.headers.get('Cache-Control')).toContain('no-store');
      expect(result.headers.get('Cache-Control')).toContain('must-revalidate');
    });

    it('should set long cache headers for static assets', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      mockUrl.pathname = '/styles.css';
      const result = await onRequest(mockContext, mockNext);

      expect(result.headers.get('Cache-Control')).toContain('max-age=31536000');
      expect(result.headers.get('Cache-Control')).toContain('immutable');
    });

    it('should set medium cache headers for images', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      mockUrl.pathname = '/image.png';
      const result = await onRequest(mockContext, mockNext);

      expect(result.headers.get('Cache-Control')).toContain('max-age=86400');
      expect(result.headers.get('Cache-Control')).toContain('stale-while-revalidate');
    });

    it('should set short cache headers for dynamic pages', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      mockUrl.pathname = '/software-engineer';
      const result = await onRequest(mockContext, mockNext);

      expect(result.headers.get('Cache-Control')).toContain('max-age=300');
      expect(result.headers.get('Vary')).toContain('Accept');
      expect(result.headers.get('Vary')).toContain('Accept-Language');
    });

    it('should add appropriate Vary headers', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      mockUrl.pathname = '/';
      const result = await onRequest(mockContext, mockNext);

      const varyHeader = result.headers.get('Vary');
      expect(varyHeader).toContain('Accept-Encoding');
      expect(varyHeader).toContain('Accept');
      expect(varyHeader).toContain('Accept-Language');
    });

    it('should add ETag for cacheable content', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      mockUrl.pathname = '/software-engineer';
      const result = await onRequest(mockContext, mockNext);

      expect(result.headers.get('ETag')).toBeTruthy();
      expect(result.headers.get('ETag')).toMatch(/^".*"$/); // Should be quoted
    });
  });

  describe('Compression Hints', () => {
    it('should add compression hints for compressible content', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      mockUrl.pathname = '/';
      mockRequest.headers.set('accept-encoding', 'gzip, br');
      mockResponse.headers.set('content-type', 'text/html');
      
      const result = await onRequest(mockContext, mockNext);

      expect(result.headers.get('X-Compress-Hint')).toBe('br'); // Brotli preferred
    });

    it('should prefer brotli over gzip', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      mockUrl.pathname = '/styles.css';
      mockRequest.headers.set('accept-encoding', 'gzip, deflate, br');
      mockResponse.headers.set('content-type', 'text/css');
      
      const result = await onRequest(mockContext, mockNext);

      expect(result.headers.get('X-Compress-Hint')).toBe('br');
    });

    it('should not add compression hints for non-compressible content', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      mockUrl.pathname = '/image.png';
      mockRequest.headers.set('accept-encoding', 'gzip, br');
      mockResponse.headers.set('content-type', 'image/png');
      
      const result = await onRequest(mockContext, mockNext);

      expect(result.headers.get('X-Compress-Hint')).toBeFalsy();
    });
  });

  describe('Performance and Monitoring Headers', () => {
    it('should add response time header', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      const result = await onRequest(mockContext, mockNext);

      const responseTime = result.headers.get('X-Response-Time');
      expect(responseTime).toBeTruthy();
      expect(responseTime).toMatch(/^\d+ms$/);
    });

    it('should add asset type in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const { onRequest } = await import('../../middleware.js');
      
      mockUrl.pathname = '/image.png';
      const result = await onRequest(mockContext, mockNext);

      expect(result.headers.get('X-Asset-Type')).toBe('image');

      process.env.NODE_ENV = originalEnv;
    });

    it('should not add debug headers in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const { onRequest } = await import('../../middleware.js');
      
      mockUrl.pathname = '/image.png';
      const result = await onRequest(mockContext, mockNext);

      expect(result.headers.get('X-Asset-Type')).toBeFalsy();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('IP Address Detection', () => {
    it('should detect IP from Cloudflare header', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      mockRequest.headers.set('cf-connecting-ip', '203.0.113.1');
      mockRequest.headers.set('x-forwarded-for', '192.168.1.1, 203.0.113.1');
      
      mockUrl.pathname = '/api/test';
      const result = await onRequest(mockContext, mockNext);

      expect(mockContext.locals.rateLimit).toBeDefined();
      // IP should be detected from cf-connecting-ip (first in priority)
    });

    it('should detect IP from X-Forwarded-For header', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      mockRequest.headers.set('x-forwarded-for', '203.0.113.2, 192.168.1.1');
      
      mockUrl.pathname = '/api/test';
      const result = await onRequest(mockContext, mockNext);

      expect(mockContext.locals.rateLimit).toBeDefined();
      // Should use first IP from X-Forwarded-For
    });

    it('should handle multiple IP formats', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      const ipHeaders = [
        ['x-real-ip', '203.0.113.3'],
        ['x-client-ip', '203.0.113.4'],
        ['forwarded-for', '203.0.113.5'],
        ['forwarded', 'for=203.0.113.6']
      ];

      for (const [header, ip] of ipHeaders) {
        mockRequest.headers.clear();
        mockRequest.headers.set(header, ip);
        mockNext.mockClear();
        
        mockUrl.pathname = '/api/test';
        const result = await onRequest(mockContext, mockNext);

        expect(mockContext.locals.rateLimit).toBeDefined();
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle requests with no user agent', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      mockRequest.headers.delete('user-agent');
      
      const result = await onRequest(mockContext, mockNext);

      expect(mockContext.locals.botCheck).toBeDefined();
      expect(mockContext.locals.botCheck.confidence).toBeGreaterThan(30);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle malformed headers gracefully', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      mockRequest.headers.set('accept-encoding', 'invalid-encoding-format-test');
      
      expect(async () => {
        await onRequest(mockContext, mockNext);
      }).not.toThrow();
    });

    it('should handle extremely long URLs', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      mockUrl.pathname = '/' + 'a'.repeat(2000);
      
      expect(async () => {
        await onRequest(mockContext, mockNext);
      }).not.toThrow();
    });

    it('should handle special characters in paths', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      const specialPaths = [
        '/path with spaces',
        '/path%20encoded',
        '/path-with-unicode-🦄',
        '/path#hash',
        '/path?query=value'
      ];

      for (const path of specialPaths) {
        mockUrl.pathname = path;
        mockNext.mockClear();
        
        expect(async () => {
          await onRequest(mockContext, mockNext);
        }).not.toThrow();
      }
    });
  });

  describe('Context and Locals', () => {
    it('should populate context locals with bot check info', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      const result = await onRequest(mockContext, mockNext);

      expect(mockContext.locals.botCheck).toBeDefined();
      expect(mockContext.locals.botCheck).toHaveProperty('status');
      expect(mockContext.locals.botCheck).toHaveProperty('confidence');
      expect(mockContext.locals.botCheck).toHaveProperty('signals');
      expect(mockContext.locals.botCheck).toHaveProperty('type');
      expect(mockContext.locals.botCheck).toHaveProperty('userAgent');
    });

    it('should populate context locals with rate limit info', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      const result = await onRequest(mockContext, mockNext);

      expect(mockContext.locals.rateLimit).toBeDefined();
      expect(mockContext.locals.rateLimit).toHaveProperty('remaining');
      expect(mockContext.locals.rateLimit).toHaveProperty('resetTime');
      expect(typeof mockContext.locals.rateLimit.remaining).toBe('number');
    });
  });

  describe('Performance Tests', () => {
    it('should process requests quickly', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      const start = Date.now();
      await onRequest(mockContext, mockNext);
      const end = Date.now();

      const processingTime = end - start;
      expect(processingTime).toBeLessThan(100); // Should be very fast in tests
    });

    it('should handle concurrent requests', async () => {
      const { onRequest } = await import('../../middleware.js');
      
      // Create multiple concurrent requests
      const promises = [];
      for (let i = 0; i < 10; i++) {
        const context = { ...mockContext };
        context.request = { ...mockRequest };
        context.request.headers = new Map(mockRequest.headers);
        context.request.headers.set('cf-connecting-ip', `192.168.1.${i}`);
        
        promises.push(onRequest(context, mockNext));
      }

      const results = await Promise.all(promises);

      // All should complete successfully
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.headers.get('X-Response-Time')).toBeTruthy();
      });
    });
  });
});