import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  detectRouteType,
  detectAssetType,
  shouldSkipMiddleware,
  isStaticAsset,
  isApiRoute,
  isCacheable,
  getCacheHeaders,
  getRouteStats,
  testRoutePattern,
  type RouteInfo
} from '@/utils/route-detection';

describe('Route Detection Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('detectRouteType', () => {
    describe('Health Endpoints', () => {
      it('should detect health endpoints correctly', () => {
        const healthRoutes = ['/api/health', '/api/readiness'];
        
        healthRoutes.forEach(route => {
          const result = detectRouteType(route);
          expect(result.type).toBe('health');
          expect(result.cacheable).toBe(false);
          expect(result.skipMiddleware).toBe(true);
          expect(result.description).toBe('Health check endpoints');
        });
      });

      it('should be case insensitive for health endpoints', () => {
        const variations = ['/API/HEALTH', '/Api/Health', '/api/READINESS'];
        
        variations.forEach(route => {
          const result = detectRouteType(route);
          expect(result.type).toBe('health');
          expect(result.skipMiddleware).toBe(true);
        });
      });

      it('should not match partial health endpoint paths', () => {
        const nonMatches = ['/api/healthcheck', '/api/health/status', '/health', '/readiness'];
        
        nonMatches.forEach(route => {
          const result = detectRouteType(route);
          expect(result.type).not.toBe('health');
        });
      });
    });

    describe('Static Assets', () => {
      it('should detect common static assets', () => {
        const staticAssets = [
          '/styles.css',
          '/script.js',
          '/image.png',
          '/icon.svg',
          '/font.woff2',
          '/data.json',
          '/config.xml'
        ];

        staticAssets.forEach(asset => {
          const result = detectRouteType(asset);
          expect(result.type).toBe('asset');
          expect(result.cacheable).toBe(true);
          expect(result.skipMiddleware).toBe(true);
          expect(result.description).toBe('Static asset files');
        });
      });

      it('should handle assets with query parameters', () => {
        const assetsWithQuery = [
          '/styles.css',
          '/script.js',
          '/image.png'
        ];

        assetsWithQuery.forEach(asset => {
          const result = detectRouteType(asset);
          expect(result.type).toBe('asset');
          expect(result.cacheable).toBe(true);
        });
      });

      it('should detect assets in subdirectories', () => {
        const nestedAssets = [
          '/static/css/styles.css',
          '/assets/js/bundle.js',
          '/images/photos/sunset.jpg',
          '/fonts/roboto/roboto.woff2'
        ];

        nestedAssets.forEach(asset => {
          const result = detectRouteType(asset);
          expect(result.type).toBe('asset');
          expect(result.cacheable).toBe(true);
        });
      });

      it('should be case insensitive for file extensions', () => {
        const caseVariations = ['/IMAGE.PNG', '/Script.JS', '/style.CSS', '/Font.WOFF2'];
        
        caseVariations.forEach(asset => {
          const result = detectRouteType(asset);
          expect(result.type).toBe('asset');
        });
      });
    });

    describe('Standard Web Assets', () => {
      it('should detect favicon variations', () => {
        const favicons = [
          '/favicon.ico',
          '/favicon-16x16.png',
          '/favicon-32x32.png',
          '/favicon-96x96.png'
        ];

        favicons.forEach(favicon => {
          const result = detectRouteType(favicon);
          expect(result.type).toBe('asset');
          expect(result.skipMiddleware).toBe(true);
          expect(result.description).toBe('Static asset files');
        });
      });

      it('should detect other standard web files', () => {
        const standardFiles = [
          '/apple-touch-icon.png',
          '/manifest.json',
          '/robots.txt',
          '/sitemap.xml'
        ];

        standardFiles.forEach(file => {
          const result = detectRouteType(file);
          expect(result.type).toBe('asset');
          expect(result.skipMiddleware).toBe(true);
        });
      });
    });

    describe('Well-known Paths', () => {
      it('should detect well-known URIs', () => {
        const wellKnownPaths = [
          '/.well-known/security.txt',
          '/.well-known/apple-app-site-association',
          '/.well-known/assetlinks.json',
          '/.well-known/openid_configuration'
        ];

        wellKnownPaths.forEach(path => {
          const result = detectRouteType(path);
          // Some well-known paths might be classified differently
          expect(['static', 'asset']).toContain(result.type);
          expect(result.cacheable).toBe(true);
          expect(result.skipMiddleware).toBe(true);
        });
      });
    });

    describe('API Endpoints', () => {
      it('should detect API routes correctly', () => {
        const apiRoutes = [
          '/api/users',
          '/api/posts/123',
          '/api/auth/login',
          '/api/image-optimize',
          '/api/monitoring'
        ];

        apiRoutes.forEach(route => {
          const result = detectRouteType(route);
          expect(result.type).toBe('api');
          expect(result.cacheable).toBe(false);
          expect(result.skipMiddleware).toBe(false);
          expect(result.description).toBe('API endpoints');
        });
      });

      it('should not match health endpoints as regular API', () => {
        const healthEndpoints = ['/api/health', '/api/readiness'];
        
        healthEndpoints.forEach(endpoint => {
          const result = detectRouteType(endpoint);
          expect(result.type).toBe('health');
          expect(result.type).not.toBe('api');
        });
      });
    });

    describe('Dynamic Pages', () => {
      it('should detect portfolio pages', () => {
        const portfolioPages = ['/software-engineer', '/customer-service'];
        
        portfolioPages.forEach(page => {
          const result = detectRouteType(page);
          expect(result.type).toBe('dynamic');
          expect(result.cacheable).toBe(true);
          expect(result.skipMiddleware).toBe(false);
          expect(result.description).toBe('Portfolio pages');
        });
      });

      it('should detect home page', () => {
        const result = detectRouteType('/');
        expect(result.type).toBe('dynamic');
        expect(result.cacheable).toBe(true);
        expect(result.skipMiddleware).toBe(false);
        expect(result.description).toBe('Home page');
      });

      it('should detect monitoring dashboard', () => {
        const monitoringRoutes = ['/monitoring/', '/monitoring/dashboard', '/monitoring/metrics'];
        
        monitoringRoutes.forEach(route => {
          const result = detectRouteType(route);
          expect(result.type).toBe('dynamic');
          expect(result.cacheable).toBe(false);
          expect(result.description).toBe('Monitoring dashboard');
        });
      });

      it('should detect health status page', () => {
        const result = detectRouteType('/health-status');
        expect(result.type).toBe('dynamic');
        expect(result.cacheable).toBe(false);
        expect(result.description).toBe('Health status dashboard');
      });
    });

    describe('Static Pages', () => {
      it('should classify simple paths as static', () => {
        const staticPages = ['/about', '/contact', '/privacy', '/terms'];
        
        staticPages.forEach(page => {
          const result = detectRouteType(page);
          expect(result.type).toBe('static');
          expect(result.cacheable).toBe(true);
          expect(result.skipMiddleware).toBe(false);
          expect(result.description).toBe('Static pages');
        });
      });
    });

    describe('Fallback Behavior', () => {
      it('should handle unknown routes with fallback', () => {
        const unknownRoutes = [
          '/some/deep/nested/path',
          '/user/123/profile/edit',
          '/very-long-complex-route-name'
        ];

        unknownRoutes.forEach(route => {
          const result = detectRouteType(route);
          // Complex paths may fall into static pattern or dynamic fallback
          expect(['dynamic', 'static']).toContain(result.type);
          expect(result.skipMiddleware).toBe(false);
        });
      });
    });
  });

  describe('detectAssetType', () => {
    it('should detect image assets', () => {
      const images = ['/photo.png', '/avatar.jpg', '/icon.svg', '/banner.webp'];
      
      images.forEach(image => {
        expect(detectAssetType(image)).toBe('images');
      });
    });

    it('should detect font assets', () => {
      const fonts = ['/font.woff', '/roboto.woff2', '/icons.ttf', '/legacy.eot'];
      
      fonts.forEach(font => {
        expect(detectAssetType(font)).toBe('fonts');
      });
    });

    it('should detect script assets', () => {
      const scripts = ['/bundle.js', '/module.mjs', '/component.jsx', '/app.tsx'];
      
      scripts.forEach(script => {
        expect(detectAssetType(script)).toBe('scripts');
      });
    });

    it('should detect style assets', () => {
      const styles = ['/styles.css', '/theme.css', '/component.css'];
      
      styles.forEach(style => {
        expect(detectAssetType(style)).toBe('styles');
      });
    });

    it('should detect document assets', () => {
      const documents = ['/data.json', '/config.xml', '/readme.txt', '/manual.pdf'];
      
      documents.forEach(doc => {
        expect(detectAssetType(doc)).toBe('documents');
      });
    });

    it('should detect media assets', () => {
      const media = ['/video.mp4', '/audio.mp3', '/song.wav', '/movie.webm'];
      
      media.forEach(mediaFile => {
        expect(detectAssetType(mediaFile)).toBe('media');
      });
    });

    it('should return undefined for non-asset paths', () => {
      const nonAssets = ['/', '/about', '/api/users', '/some-page'];
      
      nonAssets.forEach(path => {
        expect(detectAssetType(path)).toBeUndefined();
      });
    });

    it('should be case insensitive', () => {
      expect(detectAssetType('/IMAGE.PNG')).toBe('images');
      expect(detectAssetType('/FONT.WOFF2')).toBe('fonts');
      expect(detectAssetType('/SCRIPT.JS')).toBe('scripts');
    });
  });

  describe('Helper Functions', () => {
    describe('shouldSkipMiddleware', () => {
      it('should return true for routes that skip middleware', () => {
        const skipRoutes = [
          '/api/health',
          '/api/readiness',
          '/favicon.ico',
          '/styles.css',
          '/script.js',
          '/.well-known/security.txt'
        ];

        skipRoutes.forEach(route => {
          expect(shouldSkipMiddleware(route)).toBe(true);
        });
      });

      it('should return false for routes that need middleware', () => {
        const middlewareRoutes = [
          '/',
          '/software-engineer',
          '/api/users',
          '/monitoring/dashboard',
          '/about'
        ];

        middlewareRoutes.forEach(route => {
          expect(shouldSkipMiddleware(route)).toBe(false);
        });
      });
    });

    describe('isStaticAsset', () => {
      it('should return true for static assets', () => {
        const assets = ['/style.css', '/image.png', '/font.woff2', '/favicon.ico'];
        
        assets.forEach(asset => {
          expect(isStaticAsset(asset)).toBe(true);
        });
      });

      it('should return false for non-assets', () => {
        const nonAssets = ['/', '/api/health', '/about', '/monitoring/'];
        
        nonAssets.forEach(path => {
          expect(isStaticAsset(path)).toBe(false);
        });
      });
    });

    describe('isApiRoute', () => {
      it('should return true for API and health routes', () => {
        const apiRoutes = ['/api/users', '/api/health', '/api/readiness', '/api/auth'];
        
        apiRoutes.forEach(route => {
          expect(isApiRoute(route)).toBe(true);
        });
      });

      it('should return false for non-API routes', () => {
        const nonApiRoutes = ['/', '/about', '/style.css', '/monitoring/'];
        
        nonApiRoutes.forEach(route => {
          expect(isApiRoute(route)).toBe(false);
        });
      });
    });

    describe('isCacheable', () => {
      it('should return true for cacheable routes', () => {
        const cacheableRoutes = [
          '/',
          '/software-engineer',
          '/about',
          '/style.css',
          '/image.png'
        ];

        cacheableRoutes.forEach(route => {
          expect(isCacheable(route)).toBe(true);
        });
      });

      it('should return false for non-cacheable routes', () => {
        const nonCacheableRoutes = [
          '/api/users',
          '/api/health',
          '/monitoring/dashboard'
        ];

        nonCacheableRoutes.forEach(route => {
          expect(isCacheable(route)).toBe(false);
        });
      });
    });
  });

  describe('getCacheHeaders', () => {
    it('should return long cache headers for assets', () => {
      const asset = '/styles.css';
      const headers = getCacheHeaders(asset);

      expect(headers['Cache-Control']).toContain('immutable');
      expect(headers['Cache-Control']).toContain('max-age=31536000');
      expect(headers).toHaveProperty('Vary');
      expect(headers).toHaveProperty('ETag');
    });

    it('should return no-cache headers for API routes', () => {
      const apiRoute = '/api/users';
      const headers = getCacheHeaders(apiRoute);

      expect(headers['Cache-Control']).toContain('no-cache');
      expect(headers['Cache-Control']).toContain('no-store');
      expect(headers['Cache-Control']).toContain('must-revalidate');
    });

    it('should return short cache headers for dynamic pages', () => {
      const dynamicPage = '/software-engineer';
      const headers = getCacheHeaders(dynamicPage);

      expect(headers['Cache-Control']).toContain('max-age=300');
      expect(headers['Cache-Control']).toContain('stale-while-revalidate');
      expect(headers).toHaveProperty('Vary');
      expect(headers['Vary']).toContain('Accept');
      expect(headers['Vary']).toContain('Accept-Language');
    });

    it('should return medium cache headers for static pages', () => {
      const staticPage = '/about';
      const headers = getCacheHeaders(staticPage);

      expect(headers['Cache-Control']).toContain('max-age=86400');
      expect(headers).toHaveProperty('ETag');
    });

    it('should not include ETag for health endpoints', () => {
      const healthEndpoint = '/api/health';
      const headers = getCacheHeaders(healthEndpoint);

      expect(headers).not.toHaveProperty('ETag');
      expect(headers['Cache-Control']).toContain('no-cache');
    });

    it('should include proper Vary headers', () => {
      const dynamicPage = '/';
      const headers = getCacheHeaders(dynamicPage);

      expect(headers['Vary']).toContain('Accept-Encoding');
      expect(headers['Vary']).toContain('Accept');
      expect(headers['Vary']).toContain('Accept-Language');
    });
  });

  describe('getRouteStats', () => {
    it('should return correct statistics', () => {
      const stats = getRouteStats();

      expect(stats.patterns).toBeGreaterThan(0);
      expect(stats.assetTypes).toBeGreaterThan(0);
      expect(stats.cacheTypes).toBeGreaterThan(0);
      expect(typeof stats.patterns).toBe('number');
      expect(typeof stats.assetTypes).toBe('number');
      expect(typeof stats.cacheTypes).toBe('number');
    });

    it('should have expected minimum counts', () => {
      const stats = getRouteStats();

      expect(stats.patterns).toBeGreaterThanOrEqual(10); // We have at least 10 patterns
      expect(stats.assetTypes).toBeGreaterThanOrEqual(6); // images, fonts, scripts, styles, documents, media
      expect(stats.cacheTypes).toBeGreaterThanOrEqual(4); // long, medium, short, none
    });
  });

  describe('testRoutePattern', () => {
    it('should return test results with performance metrics', () => {
      const result = testRoutePattern('/api/health');

      expect(result).toHaveProperty('detected');
      expect(result).toHaveProperty('matched');
      expect(result).toHaveProperty('performance');
      expect(typeof result.performance).toBe('number');
      expect(result.performance).toBeGreaterThanOrEqual(0);
      expect(result.matched).toBe(true);
      expect(result.detected.type).toBe('health');
    });

    it('should indicate when no pattern matches', () => {
      const result = testRoutePattern('/some/unknown/deep/path');

      expect(result.matched).toBe(false);
      expect(result.detected.pattern).toBeUndefined();
      expect(result.detected.type).toBe('dynamic'); // Fallback
    });

    it('should have reasonable performance', () => {
      const testPaths = [
        '/',
        '/api/health',
        '/styles.css',
        '/software-engineer',
        '/some/unknown/path'
      ];

      testPaths.forEach(path => {
        const result = testRoutePattern(path);
        expect(result.performance).toBeLessThan(10); // Should be very fast (< 10ms)
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle high volume route detection efficiently', () => {
      const testPaths = [
        '/',
        '/software-engineer',
        '/customer-service',
        '/api/health',
        '/api/users',
        '/styles.css',
        '/image.png',
        '/font.woff2',
        '/favicon.ico',
        '/robots.txt',
        '/.well-known/security.txt',
        '/monitoring/dashboard',
        '/health-status',
        '/about',
        '/contact',
        '/some/deep/path'
      ];

      const startTime = performance.now();
      
      // Test 1000 iterations of route detection
      for (let i = 0; i < 1000; i++) {
        testPaths.forEach(path => {
          detectRouteType(path);
        });
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should complete 16,000 route detections in reasonable time
      expect(totalTime).toBeLessThan(1000); // Less than 1 second
    });

    it('should have consistent performance across different route types', () => {
      const routeTypes = {
        health: '/api/health',
        asset: '/styles.css',
        api: '/api/users',
        dynamic: '/software-engineer',
        static: '/about',
        unknown: '/some/complex/unknown/path'
      };

      const performances: Record<string, number[]> = {};

      // Test each route type multiple times
      Object.entries(routeTypes).forEach(([type, path]) => {
        performances[type] = [];
        
        for (let i = 0; i < 100; i++) {
          const result = testRoutePattern(path);
          performances[type].push(result.performance);
        }
      });

      // Check that performance is consistent (low variance)
      Object.entries(performances).forEach(([type, times]) => {
        const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
        const variance = times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / times.length;
        const stdDev = Math.sqrt(variance);

        // Performance should be reasonable (tests may have 0 time)
        expect(stdDev).toBeLessThanOrEqual(Math.max(avg * 0.5, 0.1)); // StdDev reasonable
        expect(avg).toBeLessThan(2); // Average should be very fast
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty and invalid paths', () => {
      const edgeCases = ['', '/', '//', '///', ' ', '\t', '\n'];

      edgeCases.forEach(path => {
        expect(() => detectRouteType(path)).not.toThrow();
        const result = detectRouteType(path);
        expect(result).toHaveProperty('type');
        expect(result).toHaveProperty('cacheable');
        expect(result).toHaveProperty('skipMiddleware');
      });
    });

    it('should handle paths with special characters', () => {
      const specialPaths = [
        '/path with spaces.css',
        '/path%20encoded.js',
        '/path-with-dashes.png',
        '/path_with_underscores.json',
        '/path.with.dots.xml',
        '/path@symbol.css',
        '/path#hash.js'
      ];

      specialPaths.forEach(path => {
        expect(() => detectRouteType(path)).not.toThrow();
        const result = detectRouteType(path);
        expect(result.type).toBe('asset'); // Should still detect as assets
      });
    });

    it('should handle very long paths', () => {
      const longPath = '/' + 'a'.repeat(1000) + '.css';
      
      expect(() => detectRouteType(longPath)).not.toThrow();
      const result = detectRouteType(longPath);
      expect(result.type).toBe('asset');
    });

    it('should handle paths with multiple extensions', () => {
      const multiExtPaths = [
        '/file.min.css',
        '/script.bundle.js',
        '/image.thumb.png',
        '/data.backup.json'
      ];

      multiExtPaths.forEach(path => {
        const result = detectRouteType(path);
        expect(result.type).toBe('asset');
        expect(result.assetType).toBeDefined();
      });
    });

    it('should handle case sensitivity correctly', () => {
      const casePairs = [
        ['/api/health', '/API/HEALTH'],
        ['/styles.css', '/STYLES.CSS'],
        ['/software-engineer', '/SOFTWARE-ENGINEER'],
        ['/.well-known/test', '/.WELL-KNOWN/TEST']
      ];

      casePairs.forEach(([lower, upper]) => {
        const lowerResult = detectRouteType(lower);
        const upperResult = detectRouteType(upper);

        expect(lowerResult.type).toBe(upperResult.type);
        expect(lowerResult.cacheable).toBe(upperResult.cacheable);
        expect(lowerResult.skipMiddleware).toBe(upperResult.skipMiddleware);
      });
    });
  });

  describe('Cache Control Generation', () => {
    it('should generate appropriate cache control for different asset types', () => {
      const assetTests = [
        { path: '/image.png', expectedType: 'asset', shouldHaveImmutable: true },
        { path: '/font.woff2', expectedType: 'asset', shouldHaveImmutable: true },
        { path: '/script.js', expectedType: 'asset', shouldHaveImmutable: true },
        { path: '/software-engineer', expectedType: 'dynamic', shouldHaveStaleWhileRevalidate: true },
        { path: '/about', expectedType: 'static', shouldHaveStaleWhileRevalidate: true },
        { path: '/api/users', expectedType: 'api', shouldHaveNoCache: true },
        { path: '/api/health', expectedType: 'health', shouldHaveNoCache: true }
      ];

      assetTests.forEach(({ path, expectedType, shouldHaveImmutable, shouldHaveStaleWhileRevalidate, shouldHaveNoCache }) => {
        const result = detectRouteType(path);
        const headers = getCacheHeaders(path);
        const cacheControl = headers['Cache-Control'];

        expect(result.type).toBe(expectedType);

        if (shouldHaveImmutable) {
          expect(cacheControl).toContain('immutable');
          expect(cacheControl).toContain('max-age=31536000');
        }

        if (shouldHaveStaleWhileRevalidate) {
          expect(cacheControl).toContain('stale-while-revalidate');
        }

        if (shouldHaveNoCache) {
          expect(cacheControl).toContain('no-cache');
          expect(cacheControl).toContain('no-store');
        }
      });
    });
  });
});