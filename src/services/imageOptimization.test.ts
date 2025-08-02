/**
 * Comprehensive tests for ImageOptimizationService
 * Tests caching, batch processing, performance monitoring, and error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ImageOptimizationService, imageOptimizationService } from './imageOptimization';
import type { 
  ImageOptimizationParams, 
  OptimizedImageData, 
  ResponsiveSource,
  ImageServiceConfig 
} from '../types/image';
import { 
  createMockImageData,
  createMockResponsiveSource,
  setupImageTestMocks,
  mockFetch,
} from '../test/utils/test-utils';

describe('ImageOptimizationService', () => {
  let service: ImageOptimizationService;
  let mocks: ReturnType<typeof setupImageTestMocks>;
  let fetchMock: ReturnType<typeof mockFetch>;

  beforeEach(() => {
    mocks = setupImageTestMocks();
    fetchMock = mockFetch();
    service = new ImageOptimizationService();
    
    // Mock successful API responses by default
    fetchMock.fetchMock.mockResolvedValue(
      fetchMock.mockResponse({
        success: true,
        data: createMockImageData(),
      })
    );
  });

  afterEach(() => {
    mocks.cleanup();
    fetchMock.restore();
    vi.clearAllTimers();
  });

  describe('Service Initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultService = new ImageOptimizationService();
      const stats = defaultService.getPerformanceStats();
      
      // Performance stats should be null initially
      expect(stats).toBeNull();
    });

    it('should initialize with custom configuration', () => {
      const customConfig: Partial<ImageServiceConfig> = {
        baseUrl: '/custom-api/images',
        defaultQuality: 95,
        maxCacheSize: 200,
        cacheTTL: 7200000, // 2 hours
      };
      
      const customService = new ImageOptimizationService(customConfig);
      
      // Test configuration is applied by making a request
      expect(() => customService.optimizeImage('/test.jpg')).not.toThrow();
    });

    it('should create default service instance', () => {
      expect(imageOptimizationService).toBeInstanceOf(ImageOptimizationService);
    });
  });

  describe('Image Optimization', () => {
    it('should optimize single image successfully', async () => {
      const params: ImageOptimizationParams = {
        width: 800,
        height: 600,
        quality: 90,
        format: 'webp',
      };
      
      const result = await service.optimizeImage('/test-image.jpg', params);
      
      expect(result).toEqual(createMockImageData());
      expect(fetchMock.fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/image-optimize'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Accept': 'application/json, image/avif, image/webp, image/*',
          }),
        })
      );
    });

    it('should include all optimization parameters in API request', async () => {
      const params: ImageOptimizationParams = {
        width: 800,
        height: 600,
        quality: 85,
        format: 'avif',
        fit: 'contain',
        blur: 5,
        brightness: 1.1,
        contrast: 1.2,
        saturation: 0.9,
      };
      
      await service.optimizeImage('/test-image.jpg', params);
      
      const apiUrl = fetchMock.fetchMock.mock.calls[0][0] as string;
      expect(apiUrl).toContain('w=800');
      expect(apiUrl).toContain('h=600');
      expect(apiUrl).toContain('q=85');
      expect(apiUrl).toContain('f=avif');
      expect(apiUrl).toContain('fit=contain');
      expect(apiUrl).toContain('blur=5');
      expect(apiUrl).toContain('brightness=1.1');
      expect(apiUrl).toContain('contrast=1.2');
      expect(apiUrl).toContain('saturation=0.9');
    });

    it('should handle missing parameters gracefully', async () => {
      const result = await service.optimizeImage('/test-image.jpg');
      
      expect(result).toBeDefined();
      expect(fetchMock.fetchMock).toHaveBeenCalled();
    });

    it('should return fallback data on API failure', async () => {
      fetchMock.fetchMock.mockRejectedValue(new Error('Network error'));
      
      const result = await service.optimizeImage('/test-image.jpg', { width: 800, height: 600 });
      
      expect(result).toEqual({
        sources: [],
        fallback: {
          src: '/test-image.jpg',
          width: 800,
          height: 600,
        },
        dimensions: {
          width: 800,
          height: 600,
          aspectRatio: 800 / 600,
        },
      });
    });

    it('should handle API error responses', async () => {
      fetchMock.fetchMock.mockResolvedValue(
        fetchMock.mockResponse({
          success: false,
          error: { message: 'Invalid image format' },
        })
      );
      
      const result = await service.optimizeImage('/invalid-image.txt');
      
      expect(result.sources).toEqual([]);
      expect(result.fallback.src).toBe('/invalid-image.txt');
    });

    it('should handle non-200 HTTP responses', async () => {
      fetchMock.fetchMock.mockResolvedValue(
        fetchMock.mockResponse({}, false, 404)
      );
      
      const result = await service.optimizeImage('/not-found.jpg', { width: 800 });
      
      expect(result.sources).toEqual([]);
      expect(result.fallback.src).toBe('/not-found.jpg');
    });
  });

  describe('Caching System', () => {
    it('should cache optimization results', async () => {
      const params = { width: 800, height: 600 };
      
      // First request
      await service.optimizeImage('/test-image.jpg', params);
      expect(fetchMock.fetchMock).toHaveBeenCalledTimes(1);
      
      // Second request should use cache
      await service.optimizeImage('/test-image.jpg', params);
      expect(fetchMock.fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should differentiate cache by parameters', async () => {
      await service.optimizeImage('/test-image.jpg', { width: 800 });
      await service.optimizeImage('/test-image.jpg', { width: 400 });
      
      expect(fetchMock.fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should differentiate cache by source URL', async () => {
      const params = { width: 800 };
      
      await service.optimizeImage('/image1.jpg', params);
      await service.optimizeImage('/image2.jpg', params);
      
      expect(fetchMock.fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should evict oldest cache entries when at capacity', async () => {
      // Create service with small cache
      const smallCacheService = new ImageOptimizationService({ maxCacheSize: 2 });
      
      // Fill cache to capacity
      await smallCacheService.optimizeImage('/image1.jpg', { width: 800 });
      await smallCacheService.optimizeImage('/image2.jpg', { width: 800 });
      
      // Add third item, should evict first
      await smallCacheService.optimizeImage('/image3.jpg', { width: 800 });
      
      // First item should no longer be cached
      await smallCacheService.optimizeImage('/image1.jpg', { width: 800 });
      
      expect(fetchMock.fetchMock).toHaveBeenCalledTimes(4);
    });

    it('should clean up expired cache entries', async () => {
      // Create service with short TTL
      const shortTTLService = new ImageOptimizationService({ cacheTTL: 50 });
      
      await shortTTLService.optimizeImage('/test-image.jpg', { width: 800 });
      expect(fetchMock.fetchMock).toHaveBeenCalledTimes(1);
      
      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await shortTTLService.optimizeImage('/test-image.jpg', { width: 800 });
      expect(fetchMock.fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should track cache hit statistics', async () => {
      const params = { width: 800 };
      
      // Make initial request
      await service.optimizeImage('/test-image.jpg', params);
      
      // Make cached requests
      await service.optimizeImage('/test-image.jpg', params);
      await service.optimizeImage('/test-image.jpg', params);
      
      const stats = service.getPerformanceStats();
      expect(stats?.cacheHitRate).toBeGreaterThan(0);
    });

    it('should clear cache when requested', async () => {
      await service.optimizeImage('/test-image.jpg', { width: 800 });
      expect(fetchMock.fetchMock).toHaveBeenCalledTimes(1);
      
      service.clearCache();
      
      await service.optimizeImage('/test-image.jpg', { width: 800 });
      expect(fetchMock.fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('Batch Processing', () => {
    it('should process multiple images in batch', async () => {
      const requests = [
        { src: '/image1.jpg', params: { width: 800 } },
        { src: '/image2.jpg', params: { width: 400 } },
        { src: '/image3.jpg', params: { width: 1200 } },
      ];
      
      fetchMock.fetchMock.mockResolvedValue(
        fetchMock.mockResponse({
          success: true,
          data: requests.map(() => ({ success: true, data: createMockImageData() })),
        })
      );
      
      const results = await service.optimizeImagesBatch(requests);
      
      expect(results).toHaveLength(3);
      expect(fetchMock.fetchMock).toHaveBeenCalledWith(
        '/api/image-optimize',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('"images"'),
        })
      );
    });

    it('should use cache for batch requests', async () => {
      const requests = [
        { src: '/image1.jpg', params: { width: 800 } },
        { src: '/image2.jpg', params: { width: 800 } },
      ];
      
      // Cache first image
      await service.optimizeImage('/image1.jpg', { width: 800 });
      
      // Batch request should only fetch uncached image
      fetchMock.fetchMock.mockResolvedValue(
        fetchMock.mockResponse({
          success: true,
          data: [{ success: true, data: createMockImageData() }],
        })
      );
      
      const results = await service.optimizeImagesBatch(requests);
      
      expect(results).toHaveLength(2);
      expect(fetchMock.fetchMock).toHaveBeenCalledTimes(2); // Initial + batch (partial)
    });

    it('should handle empty batch requests', async () => {
      const results = await service.optimizeImagesBatch([]);
      
      expect(results).toEqual([]);
      expect(fetchMock.fetchMock).not.toHaveBeenCalled();
    });

    it('should reject batches with too many images', async () => {
      const requests = Array(11).fill({ src: '/test.jpg', params: { width: 800 } });
      
      await expect(service.optimizeImagesBatch(requests)).rejects.toThrow(
        'Maximum 10 images per batch request'
      );
    });

    it('should handle batch API failures gracefully', async () => {
      fetchMock.fetchMock.mockRejectedValue(new Error('Batch API error'));
      
      const requests = [
        { src: '/image1.jpg', params: { width: 800, height: 600 } },
        { src: '/image2.jpg', params: { width: 400, height: 300 } },
      ];
      
      const results = await service.optimizeImagesBatch(requests);
      
      expect(results).toHaveLength(2);
      results.forEach((result, index) => {
        expect(result.sources).toEqual([]);
        expect(result.fallback.src).toBe(requests[index].src);
      });
    });

    it('should handle partial batch failures', async () => {
      const batchResponse = {
        success: true,
        data: [
          { success: true, data: createMockImageData() },
          { success: false, error: 'Processing failed' },
        ],
      };
      
      fetchMock.fetchMock.mockResolvedValue(fetchMock.mockResponse(batchResponse));
      
      const requests = [
        { src: '/image1.jpg', params: { width: 800, height: 600 } },
        { src: '/image2.jpg', params: { width: 400, height: 300 } },
      ];
      
      const results = await service.optimizeImagesBatch(requests);
      
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(createMockImageData());
      expect(results[1].sources).toEqual([]);
      expect(results[1].fallback.src).toBe('/image2.jpg');
    });
  });

  describe('Responsive Image Generation', () => {
    it('should generate responsive sources', async () => {
      const breakpoints: ResponsiveSource[] = [
        createMockResponsiveSource({ breakpoint: 'sm', width: 640 }),
        createMockResponsiveSource({ breakpoint: 'md', width: 768 }),
        createMockResponsiveSource({ breakpoint: 'lg', width: 1024 }),
      ];
      
      fetchMock.fetchMock.mockResolvedValue(
        fetchMock.mockResponse({
          success: true,
          data: breakpoints.map(() => ({ success: true, data: createMockImageData() })),
        })
      );
      
      const results = await service.generateResponsiveSources(
        '/test-image.jpg',
        breakpoints,
        { quality: 90 }
      );
      
      expect(results).toHaveLength(3);
      expect(fetchMock.fetchMock).toHaveBeenCalledWith(
        '/api/image-optimize',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"images"'),
        })
      );
    });

    it('should apply base parameters to all responsive sources', async () => {
      const breakpoints: ResponsiveSource[] = [
        createMockResponsiveSource({ breakpoint: 'sm', width: 640 }),
        createMockResponsiveSource({ breakpoint: 'lg', width: 1024 }),
      ];
      
      const baseParams = { quality: 95, format: 'avif' as const };
      
      await service.generateResponsiveSources('/test-image.jpg', breakpoints, baseParams);
      
      const requestBody = JSON.parse(fetchMock.fetchMock.mock.calls[0][1]?.body as string);
      requestBody.images.forEach((image: any) => {
        expect(image.quality).toBe(95);
        expect(image.format).toBe('avif');
      });
    });

    it('should override base parameters with breakpoint-specific ones', async () => {
      const breakpoints: ResponsiveSource[] = [
        createMockResponsiveSource({ breakpoint: 'sm', width: 640, quality: 85 }),
        createMockResponsiveSource({ breakpoint: 'lg', width: 1024, format: 'webp' }),
      ];
      
      const baseParams = { quality: 90, format: 'avif' as const };
      
      await service.generateResponsiveSources('/test-image.jpg', breakpoints, baseParams);
      
      const requestBody = JSON.parse(fetchMock.fetchMock.mock.calls[0][1]?.body as string);
      expect(requestBody.images[0].quality).toBe(85); // Overridden
      expect(requestBody.images[0].format).toBe('avif'); // From base
      expect(requestBody.images[1].quality).toBe(90); // From base
      expect(requestBody.images[1].format).toBe('webp'); // Overridden
    });
  });

  describe('Performance Monitoring', () => {
    it('should record performance metrics', async () => {
      await service.optimizeImage('/test-image.jpg', { width: 800 });
      
      const stats = service.getPerformanceStats();
      
      expect(stats).toBeDefined();
      expect(stats?.averageLoadTime).toBeGreaterThan(0);
      expect(stats?.totalRequests).toBe(1);
      expect(stats?.cacheHitRate).toBe(0); // First request
    });

    it('should dispatch performance events', async () => {
      const eventListener = vi.fn();
      window.addEventListener('image-performance-metric', eventListener);
      
      await service.optimizeImage('/test-image.jpg', { width: 800 });
      
      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            loadTime: expect.any(Number),
            format: expect.any(String),
            fromCache: false,
          }),
        })
      );
      
      window.removeEventListener('image-performance-metric', eventListener);
    });

    it('should limit stored metrics to prevent memory leaks', async () => {
      // Make more than 100 requests
      for (let i = 0; i < 105; i++) {
        await service.optimizeImage(`/test-image-${i}.jpg`, { width: 800 });
      }
      
      const stats = service.getPerformanceStats();
      expect(stats?.totalRequests).toBe(100); // Should be capped at 100
    });

    it('should calculate cache hit rate correctly', async () => {
      const params = { width: 800 };
      
      // Make initial request (cache miss)
      await service.optimizeImage('/test-image.jpg', params);
      
      // Make cached requests (cache hits)
      await service.optimizeImage('/test-image.jpg', params);
      await service.optimizeImage('/test-image.jpg', params);
      
      const stats = service.getPerformanceStats();
      expect(stats?.cacheHitRate).toBeCloseTo(2/3, 2); // 2 hits out of 3 requests
    });

    it('should track different image formats in metrics', async () => {
      fetchMock.fetchMock.mockResolvedValueOnce(
        fetchMock.mockResponse({
          success: true,
          data: createMockImageData(),
        })
      );
      
      await service.optimizeImage('/test-image.jpg', { format: 'webp' });
      
      const stats = service.getPerformanceStats();
      expect(stats).toBeDefined();
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration at runtime', () => {
      const newConfig = {
        defaultQuality: 95,
        maxCacheSize: 500,
      };
      
      service.updateConfig(newConfig);
      
      // Configuration change should not cause errors
      expect(() => service.optimizeImage('/test.jpg')).not.toThrow();
    });

    it('should merge new configuration with existing', () => {
      const originalConfig = {
        defaultQuality: 80,
        maxCacheSize: 100,
        enableWebP: true,
      };
      
      const customService = new ImageOptimizationService(originalConfig);
      
      customService.updateConfig({ defaultQuality: 95 });
      
      // Should preserve other config values
      expect(() => customService.optimizeImage('/test.jpg')).not.toThrow();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed API responses', async () => {
      fetchMock.fetchMock.mockResolvedValue(
        fetchMock.mockResponse('invalid json')
      );
      
      const result = await service.optimizeImage('/test-image.jpg', { width: 800, height: 600 });
      
      expect(result.sources).toEqual([]);
      expect(result.fallback.src).toBe('/test-image.jpg');
    });

    it('should handle network timeouts gracefully', async () => {
      fetchMock.fetchMock.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );
      
      const result = await service.optimizeImage('/test-image.jpg', { width: 800 });
      
      expect(result.sources).toEqual([]);
      expect(result.fallback).toBeDefined();
    });

    it('should handle empty or null source URLs', async () => {
      const result = await service.optimizeImage('', { width: 800 });
      
      expect(result.sources).toEqual([]);
      expect(result.fallback.src).toBe('');
    });

    it('should handle invalid optimization parameters', async () => {
      const params = {
        width: -100,
        height: 0,
        quality: 150,
        format: 'invalid' as any,
      };
      
      expect(() => service.optimizeImage('/test.jpg', params)).not.toThrow();
    });

    it('should handle concurrent optimization requests', async () => {
      const requests = Array(10).fill(null).map((_, i) => 
        service.optimizeImage(`/test-${i}.jpg`, { width: 800 })
      );
      
      const results = await Promise.all(requests);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.fallback).toBeDefined();
      });
    });

    it('should handle service initialization without window object', () => {
      const originalWindow = global.window;
      delete (global as any).window;
      
      expect(() => new ImageOptimizationService()).not.toThrow();
      
      global.window = originalWindow;
    });

    it('should handle cache cleanup interval errors', () => {
      const originalSetInterval = global.setInterval;
      global.setInterval = vi.fn(() => {
        throw new Error('Timer error');
      }) as any;
      
      expect(() => new ImageOptimizationService()).not.toThrow();
      
      global.setInterval = originalSetInterval;
    });

    it('should handle API response without success field', async () => {
      fetchMock.fetchMock.mockResolvedValue(
        fetchMock.mockResponse({ data: createMockImageData() } as any)
      );
      
      const result = await service.optimizeImage('/test-image.jpg', { width: 800 });
      
      expect(result.sources).toEqual([]);
      expect(result.fallback).toBeDefined();
    });

    it('should handle batch request with mixed success/failure', async () => {
      const batchResponse = {
        success: false,
        error: { message: 'Batch processing failed' },
      };
      
      fetchMock.fetchMock.mockResolvedValue(fetchMock.mockResponse(batchResponse));
      
      const requests = [
        { src: '/image1.jpg', params: { width: 800 } },
        { src: '/image2.jpg', params: { width: 400 } },
      ];
      
      const results = await service.optimizeImagesBatch(requests);
      
      expect(results).toHaveLength(2);
      results.forEach((result, index) => {
        expect(result.sources).toEqual([]);
        expect(result.fallback.src).toBe(requests[index].src);
      });
    });
  });
});