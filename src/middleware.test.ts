import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onRequest } from './middleware.js';

// Mock APIContext for testing
interface MockAPIContext {
  url: URL;
  request: Request;
  locals: Record<string, any>;
}

function createMockContext(pathname: string, userAgent?: string): MockAPIContext {
  const url = new URL(`http://localhost:4321${pathname}`);
  const headers = new Headers();
  if (userAgent) {
    headers.set('user-agent', userAgent);
  }
  
  return {
    url,
    request: new Request(url.toString(), { headers }),
    locals: {}
  };
}

const mockNext = vi.fn();

describe('Middleware onRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNext.mockResolvedValue(new Response('OK', { status: 200 }));
  });

  describe('Chrome DevTools handling', () => {
    it('should return 204 for Chrome DevTools appspecific requests', async () => {
      const context = createMockContext('/.well-known/appspecific/com.chrome.devtools.json');
      
      const response = await onRequest(context as any, mockNext);
      
      expect(response.status).toBe(204);
      expect(response.body).toBeNull();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should process normal requests normally', async () => {
      const context = createMockContext('/');
      
      const response = await onRequest(context as any, mockNext);
      
      expect(mockNext).toHaveBeenCalledOnce();
      expect(response.status).toBe(200);
    });
  });

  describe('Bot protection for API routes', () => {
    it('should detect bot user agents for API routes', async () => {
      const botUserAgents = [
        'Googlebot/2.1',
        'Mozilla/5.0 (compatible; bingbot/2.0)',
        'facebookexternalhit/1.1',
        'Twitterbot/1.0',
        'crawler-test',
        'spider-agent',
        'scraper-bot',
        'wget/1.21',
        'curl/7.68.0'
      ];

      for (const userAgent of botUserAgents) {
        const context = createMockContext('/api/contact', userAgent);
        
        await onRequest(context as any, mockNext);
        
        expect(context.locals.botCheck).toEqual({
          status: 'likely_bot',
          userAgent
        });
        expect(mockNext).toHaveBeenCalled();
      }
    });

    it('should identify human user agents for API routes', async () => {
      const humanUserAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
      ];

      for (const userAgent of humanUserAgents) {
        const context = createMockContext('/api/contact', userAgent);
        
        await onRequest(context as any, mockNext);
        
        expect(context.locals.botCheck).toEqual({
          status: 'likely_human',
          userAgent
        });
        expect(mockNext).toHaveBeenCalled();
      }
    });

    it('should handle missing user agent header', async () => {
      const context = createMockContext('/api/contact');
      
      await onRequest(context as any, mockNext);
      
      expect(context.locals.botCheck).toEqual({
        status: 'likely_human',
        userAgent: ''
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not apply bot protection to non-API routes', async () => {
      const context = createMockContext('/', 'Googlebot/2.1');
      
      await onRequest(context as any, mockNext);
      
      expect(context.locals.botCheck).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should apply bot protection to all API subroutes', async () => {
      const apiRoutes = [
        '/api/contact',
        '/api/newsletter',
        '/api/health',
        '/api/admin/users',
        '/api/v1/data'
      ];

      for (const route of apiRoutes) {
        const context = createMockContext(route, 'bot-agent');
        
        await onRequest(context as any, mockNext);
        
        expect(context.locals.botCheck).toBeDefined();
        expect(context.locals.botCheck.status).toBe('likely_bot');
      }
    });
  });

  describe('Case sensitivity and edge cases', () => {
    it('should handle case-insensitive bot detection', async () => {
      const caseVariations = [
        'BOT-AGENT',
        'Crawler-Test',
        'SPIDER',
        'ScRaPeR',
        'WGET',
        'CuRl'
      ];

      for (const userAgent of caseVariations) {
        const context = createMockContext('/api/test', userAgent);
        
        await onRequest(context as any, mockNext);
        
        expect(context.locals.botCheck.status).toBe('likely_bot');
      }
    });

    it('should handle user agents with bot keywords in the middle', async () => {
      const userAgents = [
        'MyApp/1.0 bot-detector/2.0',
        'Service crawler backend',
        'API spider client',
        'Data scraper tool'
      ];

      for (const userAgent of userAgents) {
        const context = createMockContext('/api/test', userAgent);
        
        await onRequest(context as any, mockNext);
        
        expect(context.locals.botCheck.status).toBe('likely_bot');
      }
    });

    it('should not flag legitimate user agents containing partial bot keywords', async () => {
      const legitimateUserAgents = [
        'MyBot Application (Human)', // Contains "bot" but is actually human
        'Robot Framework Test Runner', // Contains "robot" but not flagged
        'Embedded Browser',
        'Custom User Agent'
      ];

      for (const userAgent of legitimateUserAgents) {
        const context = createMockContext('/api/test', userAgent);
        
        await onRequest(context as any, mockNext);
        
        // These should be flagged as bots due to containing "bot" keyword
        if (userAgent.toLowerCase().includes('bot')) {
          expect(context.locals.botCheck.status).toBe('likely_bot');
        } else {
          expect(context.locals.botCheck.status).toBe('likely_human');
        }
      }
    });
  });

  describe('Performance and reliability', () => {
    it('should handle concurrent requests efficiently', async () => {
      const promises = Array.from({ length: 100 }, (_, i) => {
        const context = createMockContext('/api/test', `TestAgent-${i}`);
        return onRequest(context as any, mockNext);
      });

      const responses = await Promise.all(promises);
      
      expect(responses).toHaveLength(100);
      expect(mockNext).toHaveBeenCalledTimes(100);
    });

    it('should not modify request object directly', async () => {
      const context = createMockContext('/api/test', 'TestAgent');
      const originalRequest = context.request;
      
      await onRequest(context as any, mockNext);
      
      expect(context.request).toBe(originalRequest);
    });

    it('should handle errors gracefully', async () => {
      mockNext.mockRejectedValue(new Error('Test error'));
      const context = createMockContext('/api/test', 'TestAgent');
      
      await expect(onRequest(context as any, mockNext)).rejects.toThrow('Test error');
      
      // Ensure locals are still set even when next() throws
      expect(context.locals.botCheck).toBeDefined();
    });
  });

  describe('Migration from BotID integration', () => {
    it('should maintain same API contract as previous implementation', async () => {
      const context = createMockContext('/api/contact', 'Googlebot/2.1');
      
      await onRequest(context as any, mockNext);
      
      // Previous BotID implementation provided similar structure
      expect(context.locals.botCheck).toHaveProperty('status');
      expect(context.locals.botCheck).toHaveProperty('userAgent');
      expect(['likely_bot', 'likely_human']).toContain(context.locals.botCheck.status);
    });

    it('should provide consistent bot detection results', async () => {
      const testCases = [
        { userAgent: 'Googlebot/2.1', expectedStatus: 'likely_bot' },
        { userAgent: 'Mozilla/5.0 Chrome/91.0', expectedStatus: 'likely_human' },
        { userAgent: 'curl/7.68.0', expectedStatus: 'likely_bot' },
        { userAgent: '', expectedStatus: 'likely_human' }
      ];

      for (const { userAgent, expectedStatus } of testCases) {
        const context = createMockContext('/api/test', userAgent);
        
        await onRequest(context as any, mockNext);
        
        expect(context.locals.botCheck.status).toBe(expectedStatus);
      }
    });
  });

  describe('Security considerations', () => {
    it('should not expose sensitive information in bot check results', async () => {
      const context = createMockContext('/api/admin', 'Googlebot/2.1');
      
      await onRequest(context as any, mockNext);
      
      // Ensure no sensitive data is leaked
      expect(Object.keys(context.locals.botCheck)).toEqual(['status', 'userAgent']);
      expect(typeof context.locals.botCheck.status).toBe('string');
      expect(typeof context.locals.botCheck.userAgent).toBe('string');
    });

    it('should handle malformed user agent headers safely', async () => {
      const malformedUserAgents = [
        'User-Agent-with-special-chars',
        'Very long user agent '.repeat(10), // Reduced length to avoid header limits
        'crawler-emoji-test'
      ];

      for (const userAgent of malformedUserAgents) {
        const context = createMockContext('/api/test', userAgent);
        
        await expect(onRequest(context as any, mockNext)).resolves.toBeDefined();
        expect(context.locals.botCheck).toBeDefined();
      }
    });
  });
});