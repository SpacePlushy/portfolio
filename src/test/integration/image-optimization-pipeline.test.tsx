/**
 * Integration tests for the complete image optimization pipeline
 * Tests end-to-end workflows from component to API to service layer
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import React from 'react';
import { LazyImage } from '../../components/LazyImage';
import { ImageOptimizationService } from '../../services/imageOptimization';
import { GET, POST } from '../../pages/api/image-optimize.js';
import {
  detectBrowserCapabilities,
  generateResponsiveSources,
  buildOptimizedImageUrl,
} from '../../utils/image';
import type { ResponsiveSource, ImageOptimizationParams } from '../../types/image';
import {
  createMockImageData,
  createMockResponsiveSource,
  setupImageTestMocks,
  mockFetch,
} from '../utils/test-utils';

describe('Image Optimization Pipeline Integration', () => {
  let mocks: ReturnType<typeof setupImageTestMocks>;
  let fetchMock: ReturnType<typeof mockFetch>;
  let service: ImageOptimizationService;

  beforeEach(() => {
    mocks = setupImageTestMocks();
    fetchMock = mockFetch();
    service = new ImageOptimizationService();
  });

  afterEach(() => {
    mocks.cleanup();
    fetchMock.restore();
  });

  describe('Component to Service Integration', () => {
    it('should handle complete lazy loading workflow', async () => {
      // Mock successful API response
      fetchMock.fetchMock.mockResolvedValue(
        fetchMock.mockResponse({
          success: true,
          data: createMockImageData({
            fallback: { src: '/optimized-image.avif', width: 800, height: 600 },
          }),
        })
      );

      const onLoad = vi.fn();
      const onIntersect = vi.fn();

      render(
        <LazyImage
          src="/test-image.jpg"
          alt="Test image"
          width={800}
          height={600}
          optimization={{ quality: 90, format: 'avif' }}
          onLoad={onLoad}
          onIntersect={onIntersect}
          data-testid="lazy-image"
        />
      );

      // Image should not be loaded initially
      const image = screen.getByRole('img');
      expect(image).not.toHaveAttribute('src');

      // Trigger intersection
      act(() => {
        const callback = (global.IntersectionObserver as any).mock.calls[0][0];
        callback([{
          isIntersecting: true,
          target: document.querySelector('.lazy-image-container'),
          intersectionRatio: 1,
          boundingClientRect: new DOMRect(),
          intersectionRect: new DOMRect(),
          rootBounds: new DOMRect(),
          time: performance.now(),
        }]);
      });

      // Verify intersection callback
      expect(onIntersect).toHaveBeenCalledWith(true);

      // Wait for image to load
      await waitFor(() => {
        expect(image).toHaveAttribute('src');
      });

      // Simulate image load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      await waitFor(() => {
        expect(onLoad).toHaveBeenCalled();
      });

      // Verify optimized URL was used
      const src = image.getAttribute('src');
      expect(src).toContain('w=800');
      expect(src).toContain('h=600');
      expect(src).toContain('q=90');
      expect(src).toContain('f=avif');
    });

    it('should handle responsive image workflow', async () => {
      const responsive: ResponsiveSource[] = [
        createMockResponsiveSource({ breakpoint: 'sm', width: 640, height: 480 }),
        createMockResponsiveSource({ breakpoint: 'lg', width: 1024, height: 768 }),
      ];

      // Mock batch API response
      fetchMock.fetchMock.mockResolvedValue(
        fetchMock.mockResponse({
          success: true,
          data: responsive.map(() => ({ success: true, data: createMockImageData() })),
        })
      );

      render(
        <LazyImage
          src="/test-image.jpg"
          alt="Responsive image"
          width={1024}
          height={768}
          responsive={responsive}
          optimization={{ quality: 85 }}
        />
      );

      // Trigger intersection
      act(() => {
        const callback = (global.IntersectionObserver as any).mock.calls[0][0];
        callback([{
          isIntersecting: true,
          target: document.querySelector('.lazy-image-container'),
        }]);
      });

      await waitFor(() => {
        const picture = document.querySelector('picture');
        expect(picture).toBeInTheDocument();

        const sources = picture?.querySelectorAll('source');
        expect(sources).toHaveLength(2);
      });
    });

    it('should handle service errors gracefully in components', async () => {
      // Mock service failure
      fetchMock.fetchMock.mockRejectedValue(new Error('Service unavailable'));

      const onError = vi.fn();

      render(
        <LazyImage
          src="/test-image.jpg"
          alt="Error handling test"
          width={800}
          height={600}
          onError={onError}
          errorConfig={{ 
            fallbackSrc: '/fallback-image.jpg',
            retryAttempts: 1,
          }}
        />
      );

      // Trigger intersection
      act(() => {
        const callback = (global.IntersectionObserver as any).mock.calls[0][0];
        callback([{
          isIntersecting: true,
          target: document.querySelector('.lazy-image-container'),
        }]);
      });

      // Component should fallback gracefully
      await waitFor(() => {
        const image = screen.getByRole('img');
        expect(image).toHaveAttribute('src', '/fallback-image.jpg');
      });
    });
  });

  describe('Service to API Integration', () => {
    it('should handle complete service optimization workflow', async () => {
      const mockRequest = {
        headers: new Map([
          ['accept', 'image/avif,image/webp,*/*'],
        ]),
      };

      const mockUrl = new URL('http://localhost:3000/api/image-optimize?src=/test.jpg&w=800&h=600&q=90&f=avif');

      const apiResponse = await GET({ request: mockRequest, url: mockUrl });
      const apiData = await apiResponse.json();

      expect(apiResponse.status).toBe(200);
      expect(apiData.success).toBe(true);
      expect(apiData.data).toBeDefined();
      expect(apiData.metrics).toBeDefined();

      // Verify browser capability detection
      expect(apiData.metrics.browserCapabilities.supportsAVIF).toBe(true);
      expect(apiData.data.fallback.src).toContain('f=avif');
    });

    it('should handle batch API requests with service layer', async () => {
      const mockRequest = {
        headers: new Map([
          ['accept', 'image/webp,*/*'],
        ]),
        json: vi.fn().mockResolvedValue({
          images: [
            { src: '/image1.jpg', width: 800, height: 600, quality: 90 },
            { src: '/image2.jpg', width: 400, height: 300, quality: 80 },
            { src: '/image3.jpg', width: 1200, height: 800, responsive: true },
          ],
        }),
      };

      const apiResponse = await POST({ request: mockRequest });
      const apiData = await apiResponse.json();

      expect(apiResponse.status).toBe(200);
      expect(apiData.success).toBe(true);
      expect(apiData.data).toHaveLength(3);

      // Verify each image was processed
      apiData.data.forEach((result: any) => {
        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('fallback');
        expect(result.data).toHaveProperty('dimensions');
      });

      // Verify metrics
      expect(apiData.metrics.processedCount).toBe(3);
      expect(apiData.metrics.errorCount).toBe(0);
    });

    it('should handle mixed success/failure in batch processing', async () => {
      const mockRequest = {
        headers: new Map([['accept', 'image/webp,*/*']]),
        json: vi.fn().mockResolvedValue({
          images: [
            { src: '/valid-image.jpg', width: 800, height: 600 },
            { src: '', width: 800 }, // Invalid - missing src
            { src: '/another-valid.jpg', width: 0 }, // Invalid - invalid width
          ],
        }),
      };

      const apiResponse = await POST({ request: mockRequest });
      const apiData = await apiResponse.json();

      expect(apiResponse.status).toBe(200);
      expect(apiData.success).toBe(true);
      expect(apiData.data).toHaveLength(3);

      expect(apiData.data[0].success).toBe(true);
      expect(apiData.data[1].success).toBe(false);
      expect(apiData.data[2].success).toBe(false);

      expect(apiData.metrics.processedCount).toBe(1);
      expect(apiData.metrics.errorCount).toBe(2);
    });
  });

  describe('Utility to API Integration', () => {
    it('should integrate browser capability detection with API responses', async () => {
      // Test AVIF support
      const avifCapabilities = detectBrowserCapabilities();
      // Mock AVIF support
      vi.mocked(detectBrowserCapabilities).mockReturnValue({
        ...avifCapabilities,
        supportsAVIF: true,
      });

      const mockRequest = {
        headers: new Map([['accept', 'image/avif,image/webp,*/*']]),
      };

      const mockUrl = new URL('http://localhost:3000/api/image-optimize?src=/test.jpg&w=800');

      const response = await GET({ request: mockRequest, url: mockUrl });
      const data = await response.json();

      expect(data.metrics.browserCapabilities.supportsAVIF).toBe(true);
      expect(data.data.fallback.src).toContain('f=avif');
    });

    it('should integrate responsive source generation with API', async () => {
      const responsive: ResponsiveSource[] = [
        { breakpoint: 'sm', width: 640, height: 480 },
        { breakpoint: 'lg', width: 1024, height: 768 },
      ];

      const mockSources = generateResponsiveSources('/test.jpg', responsive, { quality: 85 });

      expect(mockSources).toHaveLength(2);
      mockSources.forEach((source, index) => {
        expect(source.width).toBe(responsive[index].width);
        expect(source.height).toBe(responsive[index].height);
        expect(source.quality).toBe(85);
      });
    });

    it('should integrate URL building with optimization parameters', async () => {
      const params: ImageOptimizationParams = {
        width: 800,
        height: 600,
        quality: 90,
        format: 'webp',
        fit: 'contain',
        blur: 5,
        brightness: 1.1,
      };

      const optimizedUrl = buildOptimizedImageUrl('/test-image.jpg', params);

      expect(optimizedUrl).toContain('w=800');
      expect(optimizedUrl).toContain('h=600');
      expect(optimizedUrl).toContain('q=90');
      expect(optimizedUrl).toContain('f=webp');
      expect(optimizedUrl).toContain('fit=contain');
      expect(optimizedUrl).toContain('blur=5');
      expect(optimizedUrl).toContain('brightness=1.1');
    });
  });

  describe('End-to-End Workflow', () => {
    it('should handle complete image optimization workflow', async () => {
      // 1. Component requests optimization
      // 2. Service calls API
      // 3. API uses utilities to optimize
      // 4. Response flows back to component

      // Mock API response
      fetchMock.fetchMock.mockResolvedValue(
        fetchMock.mockResponse({
          success: true,
          data: createMockImageData({
            fallback: { src: '/optimized.avif', width: 800, height: 600 },
            sources: [
              {
                src: '/optimized-800.avif',
                srcSet: '/optimized-800.avif 1x, /optimized-1600.avif 2x',
                sizes: '(min-width: 1024px) 800px, 100vw',
                format: 'avif',
                width: 800,
                height: 600,
                quality: 90,
              },
            ],
          }),
        })
      );

      const performanceListener = vi.fn();
      document.addEventListener('lazy-image-loaded', performanceListener);

      render(
        <LazyImage
          src="/test-image.jpg"
          alt="End-to-end test"
          width={800}
          height={600}
          optimization={{ quality: 90, format: 'avif' }}
          responsive={[
            createMockResponsiveSource({ breakpoint: 'lg', width: 800, height: 600 }),
          ]}
          criticalResource
          preload
        />
      );

      // Verify preload was triggered
      expect(document.head.appendChild).toHaveBeenCalled();

      // Image should load immediately for critical resources
      await waitFor(() => {
        const image = screen.getByRole('img');
        expect(image).toHaveAttribute('src');
      });

      // Simulate image load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      // Verify performance event was dispatched
      await waitFor(() => {
        expect(performanceListener).toHaveBeenCalledWith(
          expect.objectContaining({
            detail: expect.objectContaining({
              src: expect.any(String),
              metrics: expect.any(Object),
            }),
          })
        );
      });

      document.removeEventListener('lazy-image-loaded', performanceListener);
    });

    it('should handle complete error recovery workflow', async () => {
      // Mock initial API failure
      fetchMock.fetchMock
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(
          fetchMock.mockResponse({
            success: true,
            data: createMockImageData({
              fallback: { src: '/fallback-image.jpg', width: 800, height: 600 },
            }),
          })
        );

      const onError = vi.fn();
      const errorConfig = {
        fallbackSrc: '/fallback-image.jpg',
        retryAttempts: 2,
        retryDelay: 50,
        onError,
      };

      render(
        <LazyImage
          src="/failing-image.jpg"
          alt="Error recovery test"
          width={800}
          height={600}
          onError={onError}
          errorConfig={errorConfig}
        />
      );

      // Trigger intersection
      act(() => {
        const callback = (global.IntersectionObserver as any).mock.calls[0][0];
        callback([{
          isIntersecting: true,
          target: document.querySelector('.lazy-image-container'),
        }]);
      });

      // Wait for error handling
      await waitFor(() => {
        const image = screen.getByRole('img');
        expect(image).toHaveAttribute('src', '/fallback-image.jpg');
      });

      expect(onError).toHaveBeenCalled();
      expect(errorConfig.onError).toHaveBeenCalled();
    });

    it('should handle complete caching workflow', async () => {
      const params = { width: 800, height: 600, quality: 90 };

      // Mock API response
      fetchMock.fetchMock.mockResolvedValue(
        fetchMock.mockResponse({
          success: true,
          data: createMockImageData(),
        })
      );

      // First optimization - should hit API
      const result1 = await service.optimizeImage('/cached-image.jpg', params);
      expect(fetchMock.fetchMock).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(createMockImageData());

      // Second optimization - should use cache
      const result2 = await service.optimizeImage('/cached-image.jpg', params);
      expect(fetchMock.fetchMock).toHaveBeenCalledTimes(1); // No additional API call
      expect(result2).toEqual(createMockImageData());

      // Verify performance stats
      const stats = service.getPerformanceStats();
      expect(stats?.cacheHitRate).toBe(0.5); // 1 hit out of 2 requests
      expect(stats?.totalRequests).toBe(2);
    });

    it('should handle viewport changes and responsive loading', async () => {
      const responsive: ResponsiveSource[] = [
        createMockResponsiveSource({ breakpoint: 'sm', width: 640 }),
        createMockResponsiveSource({ breakpoint: 'lg', width: 1024 }),
      ];

      render(
        <LazyImage
          src="/responsive-image.jpg"
          alt="Responsive test"
          responsive={responsive}
          optimization={{ quality: 85 }}
        />
      );

      // Simulate viewport change
      act(() => {
        window.__TEST_UTILS__.triggerResize(1200, 800);
      });

      // Trigger intersection
      act(() => {
        const callback = (global.IntersectionObserver as any).mock.calls[0][0];
        callback([{
          isIntersecting: true,
          target: document.querySelector('.lazy-image-container'),
        }]);
      });

      await waitFor(() => {
        const picture = document.querySelector('picture');
        expect(picture).toBeInTheDocument();

        const sources = picture?.querySelectorAll('source');
        expect(sources?.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance Integration', () => {
    it('should track performance across the entire pipeline', async () => {
      const startTime = performance.now();

      // Mock API with delay to simulate real processing
      fetchMock.fetchMock.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve(fetchMock.mockResponse({
            success: true,
            data: createMockImageData(),
          })), 100)
        )
      );

      const result = await service.optimizeImage('/performance-test.jpg', { width: 800 });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(result).toBeDefined();
      expect(totalTime).toBeGreaterThan(100); // Should include API delay

      const stats = service.getPerformanceStats();
      expect(stats?.averageLoadTime).toBeGreaterThan(0);
    });

    it('should handle concurrent requests efficiently', async () => {
      // Mock API responses
      fetchMock.fetchMock.mockResolvedValue(
        fetchMock.mockResponse({
          success: true,
          data: createMockImageData(),
        })
      );

      const requests = Array(5).fill(null).map((_, i) =>
        service.optimizeImage(`/concurrent-${i}.jpg`, { width: 800 })
      );

      const startTime = performance.now();
      const results = await Promise.all(requests);
      const endTime = performance.now();

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.fallback).toBeDefined();
      });

      // Concurrent requests should be faster than sequential
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('Browser Compatibility Integration', () => {
    it('should adapt to different browser capabilities', async () => {
      const testCases = [
        {
          acceptHeader: 'image/avif,image/webp,*/*',
          expectedFormat: 'avif',
          capabilities: { supportsAVIF: true, supportsWebP: true },
        },
        {
          acceptHeader: 'image/webp,*/*',
          expectedFormat: 'webp',
          capabilities: { supportsAVIF: false, supportsWebP: true },
        },
        {
          acceptHeader: 'text/html,*/*',
          expectedFormat: 'jpeg',
          capabilities: { supportsAVIF: false, supportsWebP: false },
        },
      ];

      for (const testCase of testCases) {
        const mockRequest = {
          headers: new Map([['accept', testCase.acceptHeader]]),
        };

        const mockUrl = new URL('http://localhost:3000/api/image-optimize?src=/test.jpg&w=800');

        const response = await GET({ request: mockRequest, url: mockUrl });
        const data = await response.json();

        expect(data.success).toBe(true);
        expect(data.metrics.browserCapabilities.supportsAVIF).toBe(testCase.capabilities.supportsAVIF);
        expect(data.metrics.browserCapabilities.supportsWebP).toBe(testCase.capabilities.supportsWebP);
        expect(data.data.fallback.src).toContain(`f=${testCase.expectedFormat}`);
      }
    });
  });
});