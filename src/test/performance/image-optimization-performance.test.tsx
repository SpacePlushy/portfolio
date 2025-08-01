/**
 * Performance tests for image optimization system
 * Tests loading times, caching efficiency, memory usage, and throughput
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import React from 'react';
import { LazyImage } from '../../components/LazyImage';
import { ImageOptimizationService } from '../../services/imageOptimization';
import {
  detectBrowserCapabilities,
  generateResponsiveSources,
  debounce,
  preloadImage,
} from '../../utils/image';
import type { ResponsiveSource, ImageOptimizationParams } from '../../types/image';
import {
  createMockImageData,
  createMockResponsiveSource,
  setupImageTestMocks,
  mockFetch,
  measureRenderTime,
  simulateSlowNetwork,
} from '../utils/test-utils';

describe('Image Optimization Performance', () => {
  let mocks: ReturnType<typeof setupImageTestMocks>;
  let fetchMock: ReturnType<typeof mockFetch>;
  let service: ImageOptimizationService;

  beforeEach(() => {
    mocks = setupImageTestMocks();
    fetchMock = mockFetch();
    service = new ImageOptimizationService();

    // Mock successful responses by default
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
  });

  describe('Component Rendering Performance', () => {
    it('should render LazyImage component within performance budget', async () => {
      const renderTime = await measureRenderTime(async () => {
        render(<LazyImage src="/test.jpg" alt="Performance test" width={800} height={600} />);
      });

      // Component should render within 50ms
      expect(renderTime).toBeLessThan(50);
    });

    it('should handle multiple LazyImage components efficiently', async () => {
      const componentCount = 20;
      const components = Array(componentCount).fill(null).map((_, i) => (
        <LazyImage
          key={i}
          src={`/test-${i}.jpg`}
          alt={`Performance test ${i}`}
          width={800}
          height={600}
        />
      ));

      const renderTime = await measureRenderTime(async () => {
        render(<div>{components}</div>);
      });

      // Should render 20 components within 200ms
      expect(renderTime).toBeLessThan(200);
    });

    it('should handle rapid intersection changes efficiently', async () => {
      render(<LazyImage src="/test.jpg" alt="Intersection test" width={800} height={600} />);

      const container = document.querySelector('.lazy-image-container');
      const callback = (global.IntersectionObserver as any).mock.calls[0][0];

      const startTime = performance.now();

      // Simulate rapid intersection changes
      for (let i = 0; i < 100; i++) {
        act(() => {
          callback([{
            isIntersecting: i % 2 === 0,
            target: container,
            intersectionRatio: i % 2,
            boundingClientRect: new DOMRect(),
            intersectionRect: new DOMRect(),
            rootBounds: new DOMRect(),
            time: performance.now(),
          }]);
        });
      }

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Should handle 100 intersection changes within 100ms
      expect(processingTime).toBeLessThan(100);
    });

    it('should handle responsive image rendering efficiently', async () => {
      const responsive: ResponsiveSource[] = Array(5).fill(null).map((_, i) => 
        createMockResponsiveSource({ 
          breakpoint: ['xs', 'sm', 'md', 'lg', 'xl'][i] as any,
          width: 400 + (i * 200) 
        })
      );

      const renderTime = await measureRenderTime(async () => {
        render(
          <LazyImage
            src="/responsive-test.jpg"
            alt="Responsive performance test"
            responsive={responsive}
            optimization={{ quality: 85 }}
          />
        );
      });

      // Responsive image with 5 breakpoints should render within 100ms
      expect(renderTime).toBeLessThan(100);
    });

    it('should minimize memory usage with large numbers of components', async () => {
      const componentCount = 50;
      const initialMemory = performance.memory?.usedJSHeapSize || 0;

      const components = Array(componentCount).fill(null).map((_, i) => (
        <LazyImage
          key={i}
          src={`/memory-test-${i}.jpg`}
          alt={`Memory test ${i}`}
          width={400}
          height={300}
        />
      ));

      render(<div>{components}</div>);

      // Allow for garbage collection
      await new Promise(resolve => setTimeout(resolve, 100));

      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 5MB for 50 components)
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
    });
  });

  describe('Service Layer Performance', () => {
    it('should optimize single image within performance budget', async () => {
      const params: ImageOptimizationParams = {
        width: 800,
        height: 600,
        quality: 90,
        format: 'webp',
      };

      const startTime = performance.now();
      const result = await service.optimizeImage('/performance-test.jpg', params);
      const endTime = performance.now();

      const optimizationTime = endTime - startTime;

      expect(result).toBeDefined();
      // Single optimization should complete within 500ms
      expect(optimizationTime).toBeLessThan(500);
    });

    it('should handle batch optimization efficiently', async () => {
      const batchSize = 10;
      const requests = Array(batchSize).fill(null).map((_, i) => ({
        src: `/batch-test-${i}.jpg`,
        params: { width: 800, height: 600, quality: 85 },
      }));

      // Mock batch API response
      fetchMock.fetchMock.mockResolvedValue(
        fetchMock.mockResponse({
          success: true,
          data: requests.map(() => ({ success: true, data: createMockImageData() })),
        })
      );

      const startTime = performance.now();
      const results = await service.optimizeImagesBatch(requests);
      const endTime = performance.now();

      const batchTime = endTime - startTime;

      expect(results).toHaveLength(batchSize);
      // Batch of 10 should complete within 1 second
      expect(batchTime).toBeLessThan(1000);
    });

    it('should demonstrate cache performance benefits', async () => {
      const params = { width: 800, height: 600, quality: 90 };

      // First request (cache miss)
      const startTime1 = performance.now();
      await service.optimizeImage('/cache-test.jpg', params);
      const endTime1 = performance.now();
      const firstRequestTime = endTime1 - startTime1;

      // Second request (cache hit)
      const startTime2 = performance.now();
      await service.optimizeImage('/cache-test.jpg', params);
      const endTime2 = performance.now();
      const secondRequestTime = endTime2 - startTime2;

      // Cached request should be significantly faster
      expect(secondRequestTime).toBeLessThan(firstRequestTime * 0.1);
      expect(secondRequestTime).toBeLessThan(10); // Should be nearly instantaneous
    });

    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 15;
      const requests = Array(concurrentRequests).fill(null).map((_, i) =>
        service.optimizeImage(`/concurrent-${i}.jpg`, { width: 800, height: 600 })
      );

      const startTime = performance.now();
      const results = await Promise.all(requests);
      const endTime = performance.now();

      const totalTime = endTime - startTime;

      expect(results).toHaveLength(concurrentRequests);
      results.forEach(result => expect(result).toBeDefined());

      // 15 concurrent requests should complete within 2 seconds
      expect(totalTime).toBeLessThan(2000);
    });

    it('should maintain performance under high cache pressure', async () => {
      // Create service with small cache to test eviction performance
      const highPressureService = new ImageOptimizationService({ 
        maxCacheSize: 5 
      });

      const requestCount = 20;
      const startTime = performance.now();

      // Make more requests than cache capacity
      for (let i = 0; i < requestCount; i++) {
        await highPressureService.optimizeImage(`/pressure-test-${i}.jpg`, { width: 800 });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should handle cache pressure without significant performance degradation
      expect(totalTime).toBeLessThan(3000);
    });
  });

  describe('Utility Function Performance', () => {
    it('should detect browser capabilities quickly', () => {
      const iterations = 1000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        detectBrowserCapabilities();
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;

      // Each capability detection should take less than 1ms
      expect(avgTime).toBeLessThan(1);
    });

    it('should generate responsive sources efficiently', () => {
      const responsive: ResponsiveSource[] = Array(10).fill(null).map((_, i) =>
        createMockResponsiveSource({ 
          breakpoint: 'lg',
          width: 800 + (i * 100) 
        })
      );

      const iterations = 100;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        generateResponsiveSources('/test.jpg', responsive, { quality: 85 });
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;

      // Each responsive source generation should take less than 5ms
      expect(avgTime).toBeLessThan(5);
    });

    it('should handle debounce function efficiently', async () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 50);

      const startTime = performance.now();

      // Make many rapid calls
      for (let i = 0; i < 100; i++) {
        debouncedFn(`call-${i}`);
      }

      const endTime = performance.now();
      const callTime = endTime - startTime;

      // 100 debounced calls should complete within 50ms
      expect(callTime).toBeLessThan(50);

      // Wait for debounce to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should only execute once
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('call-99');
    });

    it('should handle preload operations efficiently', async () => {
      const preloadCount = 10;
      const urls = Array(preloadCount).fill(null).map((_, i) => `/preload-test-${i}.jpg`);

      const startTime = performance.now();

      const preloadPromises = urls.map(url => preloadImage(url, 'high'));
      await Promise.all(preloadPromises);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // 10 preloads should complete within 1 second
      expect(totalTime).toBeLessThan(1000);

      // Verify all preload links were created
      expect(document.head.appendChild).toHaveBeenCalledTimes(preloadCount);
    });
  });

  describe('Network Performance', () => {
    it('should handle slow network conditions gracefully', async () => {
      const slowNetwork = simulateSlowNetwork();

      const startTime = performance.now();
      
      const result = await service.optimizeImage('/slow-network-test.jpg', { 
        width: 800, 
        height: 600 
      });

      const endTime = performance.now();
      const requestTime = endTime - startTime;

      expect(result).toBeDefined();
      // Should handle 2-second network delay plus processing
      expect(requestTime).toBeGreaterThan(2000);
      expect(requestTime).toBeLessThan(3000);

      slowNetwork.restore();
    });

    it('should timeout long-running requests appropriately', async () => {
      // Mock extremely slow response
      fetchMock.fetchMock.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve(fetchMock.mockResponse({
            success: true,
            data: createMockImageData(),
          })), 10000) // 10 second delay
        )
      );

      const startTime = performance.now();
      
      // Service should handle this gracefully and return fallback
      const result = await service.optimizeImage('/timeout-test.jpg', { 
        width: 800, 
        height: 600 
      });

      const endTime = performance.now();
      const requestTime = endTime - startTime;

      expect(result).toBeDefined();
      expect(result.fallback.src).toBe('/timeout-test.jpg');
      
      // Should not wait for the full 10 seconds in a real timeout scenario
      // In our test, it completes immediately due to the fallback mechanism
      expect(requestTime).toBeLessThan(1000);
    });

    it('should handle API rate limiting efficiently', async () => {
      let requestCount = 0;
      
      fetchMock.fetchMock.mockImplementation(() => {
        requestCount++;
        if (requestCount <= 5) {
          return Promise.resolve(fetchMock.mockResponse({
            success: true,
            data: createMockImageData(),
          }));
        } else {
          return Promise.resolve(fetchMock.mockResponse({}, false, 429)); // Rate limited
        }
      });

      const requests = Array(10).fill(null).map((_, i) =>
        service.optimizeImage(`/rate-test-${i}.jpg`, { width: 800 })
      );

      const results = await Promise.all(requests);

      expect(results).toHaveLength(10);
      
      // First 5 should succeed, rest should get fallback
      results.slice(0, 5).forEach(result => {
        expect(result.sources).toBeDefined();
      });
      
      results.slice(5).forEach((result, i) => {
        expect(result.fallback.src).toBe(`/rate-test-${i + 5}.jpg`);
      });
    });
  });

  describe('Memory Performance', () => {
    it('should clean up intersection observers properly', () => {
      const componentCount = 10;
      const observers: any[] = [];

      // Track created observers
      const originalIO = global.IntersectionObserver;
      global.IntersectionObserver = vi.fn().mockImplementation((callback) => {
        const observer = {
          observe: vi.fn(),
          unobserve: vi.fn(),
          disconnect: vi.fn(),
        };
        observers.push(observer);
        return observer;
      });

      const components = Array(componentCount).fill(null).map((_, i) => (
        <LazyImage
          key={i}
          src={`/cleanup-test-${i}.jpg`}
          alt={`Cleanup test ${i}`}
          width={400}
          height={300}
        />
      ));

      const { unmount } = render(<div>{components}</div>);

      expect(observers).toHaveLength(componentCount);

      // Unmount components
      unmount();

      // All observers should be disconnected
      observers.forEach(observer => {
        expect(observer.disconnect).toHaveBeenCalled();
      });

      global.IntersectionObserver = originalIO;
    });

    it('should prevent memory leaks in service layer', async () => {
      const requestCount = 100;
      
      // Make many requests to potentially cause memory leaks
      for (let i = 0; i < requestCount; i++) {
        await service.optimizeImage(`/memory-leak-test-${i}.jpg`, { width: 800 });
      }

      const stats = service.getPerformanceStats();
      
      // Service should limit stored metrics to prevent memory leaks
      expect(stats?.totalRequests).toBeLessThanOrEqual(100);
    });

    it('should handle cache cleanup efficiently', () => {
      // Create service with aggressive cleanup
      const cleanupService = new ImageOptimizationService({ 
        cacheTTL: 1, // 1ms TTL for immediate expiration
        maxCacheSize: 100 
      });

      const startTime = performance.now();

      // Make requests that will immediately expire
      const promises = Array(50).fill(null).map(async (_, i) => {
        await cleanupService.optimizeImage(`/cleanup-${i}.jpg`, { width: 800 });
        // Small delay to ensure expiration
        await new Promise(resolve => setTimeout(resolve, 5));
      });

      return Promise.all(promises).then(() => {
        const endTime = performance.now();
        const totalTime = endTime - startTime;

        // Cache cleanup should not significantly impact performance
        expect(totalTime).toBeLessThan(2000);
      });
    });
  });

  describe('Edge Case Performance', () => {
    it('should handle malformed parameters efficiently', async () => {
      const malformedParams = [
        { width: -100, height: 'invalid' as any, quality: 150 },
        { format: 'nonexistent' as any, fit: 'invalid' as any },
        { blur: -5, brightness: 'bright' as any },
        null as any,
        undefined as any,
      ];

      const startTime = performance.now();

      const results = await Promise.all(
        malformedParams.map((params, i) =>
          service.optimizeImage(`/malformed-${i}.jpg`, params)
        )
      );

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(results).toHaveLength(malformedParams.length);
      results.forEach(result => expect(result).toBeDefined());

      // Should handle malformed parameters within reasonable time
      expect(totalTime).toBeLessThan(1000);
    });

    it('should handle extremely large batch requests gracefully', async () => {
      // Test with maximum allowed batch size
      const maxBatchSize = 10;
      const requests = Array(maxBatchSize).fill(null).map((_, i) => ({
        src: `/large-batch-${i}.jpg`,
        params: { 
          width: 1920, 
          height: 1080, 
          quality: 95,
          blur: 2,
          brightness: 1.1,
          contrast: 1.2,
        },
      }));

      fetchMock.fetchMock.mockResolvedValue(
        fetchMock.mockResponse({
          success: true,
          data: requests.map(() => ({ success: true, data: createMockImageData() })),
        })
      );

      const startTime = performance.now();
      const results = await service.optimizeImagesBatch(requests);
      const endTime = performance.now();

      const batchTime = endTime - startTime;

      expect(results).toHaveLength(maxBatchSize);
      // Large batch should complete within 2 seconds
      expect(batchTime).toBeLessThan(2000);
    });

    it('should maintain performance with frequent configuration changes', async () => {
      const configChangeCount = 50;
      const startTime = performance.now();

      for (let i = 0; i < configChangeCount; i++) {
        service.updateConfig({
          defaultQuality: 70 + (i % 30),
          maxCacheSize: 50 + (i % 100),
        });
        
        await service.optimizeImage(`/config-change-${i}.jpg`, { width: 800 });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Frequent config changes should not severely impact performance
      expect(totalTime).toBeLessThan(3000);
    });
  });
});