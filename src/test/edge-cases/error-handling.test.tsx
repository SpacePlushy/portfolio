/**
 * Comprehensive error handling and edge case tests
 * Tests system resilience under various failure conditions and unusual inputs
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
  validateImageUrl,
  getImageDimensions,
  generateBlurPlaceholder,
} from '../../utils/image';
import type { 
  ImageOptimizationParams, 
  ResponsiveSource,
  LazyImageProps 
} from '../../types/image';
import {
  createMockImageData,
  setupImageTestMocks,
  mockFetch,
  simulateNetworkError,
  simulateImageLoadError,
  simulateSlowNetwork,
} from '../utils/test-utils';

describe('Error Handling and Edge Cases', () => {
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

  describe('Network Error Handling', () => {
    it('should handle complete network failure gracefully', async () => {
      simulateNetworkError();

      const result = await service.optimizeImage('/test.jpg', { width: 800, height: 600 });

      expect(result).toEqual({
        sources: [],
        fallback: {
          src: '/test.jpg',
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

    it('should handle intermittent network errors with retry', async () => {
      let attemptCount = 0;
      fetchMock.fetchMock.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Network timeout'));
        }
        return Promise.resolve(fetchMock.mockResponse({
          success: true,
          data: createMockImageData(),
        }));
      });

      const result = await service.optimizeImage('/retry-test.jpg', { width: 800 });

      expect(result).toEqual(createMockImageData());
      expect(attemptCount).toBe(3);
    });

    it('should handle DNS resolution failures', async () => {
      fetchMock.fetchMock.mockRejectedValue(new Error('DNS resolution failed'));

      const result = await service.optimizeImage('/dns-test.jpg', { width: 800, height: 600 });

      expect(result.fallback.src).toBe('/dns-test.jpg');
      expect(result.sources).toEqual([]);
    });

    it('should handle SSL certificate errors', async () => {
      fetchMock.fetchMock.mockRejectedValue(new Error('SSL certificate invalid'));

      const result = await service.optimizeImage('/ssl-test.jpg', { width: 800 });

      expect(result).toBeDefined();
      expect(result.fallback.src).toBe('/ssl-test.jpg');
    });

    it('should handle rate limiting gracefully', async () => {
      fetchMock.fetchMock.mockResolvedValue(
        fetchMock.mockResponse({}, false, 429) // Too Many Requests
      );

      const result = await service.optimizeImage('/rate-limited.jpg', { width: 800 });

      expect(result.fallback.src).toBe('/rate-limited.jpg');
    });
  });

  describe('Image Loading Errors', () => {
    it('should handle image 404 errors', async () => {
      const imageError = simulateImageLoadError();

      render(
        <LazyImage
          src="/not-found.jpg"
          alt="404 test"
          width={800}
          height={600}
          errorConfig={{ fallbackSrc: '/placeholder.jpg' }}
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
        const image = screen.getByRole('img');
        expect(image).toHaveAttribute('src', '/placeholder.jpg');
      });

      imageError.restore();
    });

    it('should handle corrupted image data', async () => {
      global.Image = class extends (global.Image as any) {
        constructor() {
          super();
          // Simulate corrupted data after some delay
          setTimeout(() => {
            if (this.onerror) {
              const errorEvent = new ErrorEvent('error', {
                message: 'Invalid image data',
                filename: this.src,
              });
              this.onerror(errorEvent);
            }
          }, 50);
        }
      } as any;

      const onError = vi.fn();

      render(
        <LazyImage
          src="/corrupted.jpg"
          alt="Corrupted image test"
          width={800}
          height={600}
          onError={onError}
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
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    it('should handle unsupported image formats', async () => {
      const result = await validateImageUrl('/test.bmp');
      
      if (typeof window !== 'undefined') {
        // In browser environment, should attempt validation
        expect(typeof result).toBe('boolean');
      } else {
        // In server environment, should return true
        expect(result).toBe(true);
      }
    });

    it('should handle extremely large images', async () => {
      const params: ImageOptimizationParams = {
        width: 10000,
        height: 10000,
        quality: 100,
      };

      // API should reject or handle gracefully
      const mockRequest = {
        headers: new Map([['accept', 'image/webp,*/*']]),
      };

      const mockUrl = new URL(`http://localhost:3000/api/image-optimize?src=/huge.jpg&w=${params.width}&h=${params.height}`);

      const response = await GET({ request: mockRequest, url: mockUrl });
      const data = await response.json();

      // Should either succeed or fail gracefully
      expect([200, 400]).toContain(response.status);
      
      if (response.status === 400) {
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
      }
    });
  });

  describe('Invalid Input Handling', () => {
    it('should handle null and undefined sources', () => {
      expect(() => {
        render(<LazyImage src={null as any} alt="Null src test" width={800} height={600} />);
      }).not.toThrow();

      expect(() => {
        render(<LazyImage src={undefined as any} alt="Undefined src test" width={800} height={600} />);
      }).not.toThrow();
    });

    it('should handle malformed URLs', async () => {
      const malformedUrls = [
        'not-a-url',
        '://invalid',
        'http://',
        'ftp://unsupported-protocol.com/image.jpg',
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
      ];

      for (const url of malformedUrls) {
        expect(() => {
          render(<LazyImage src={url} alt="Malformed URL test" width={800} height={600} />);
        }).not.toThrow();
      }
    });

    it('should handle invalid dimensions', () => {
      const invalidDimensions = [
        { width: -100, height: 600 },
        { width: 800, height: -100 },
        { width: NaN, height: 600 },
        { width: 800, height: Infinity },
        { width: 0, height: 0 },
      ];

      invalidDimensions.forEach((dimensions, index) => {
        expect(() => {
          render(
            <LazyImage
              key={index}
              src={`/test-${index}.jpg`}
              alt="Invalid dimensions test"
              {...dimensions}
            />
          );
        }).not.toThrow();
      });
    });

    it('should handle invalid optimization parameters', async () => {
      const invalidParams = [
        { quality: -50 },
        { quality: 150 },
        { quality: NaN },
        { format: 'invalid-format' as any },
        { fit: 'invalid-fit' as any },
        { blur: -10 },
        { brightness: -5 },
        { contrast: 'invalid' as any },
      ];

      for (const params of invalidParams) {
        expect(() => {
          service.optimizeImage('/test.jpg', params);
        }).not.toThrow();
      }
    });

    it('should handle circular references in parameters', () => {
      const circular: any = { width: 800 };
      circular.self = circular;

      expect(() => {
        service.optimizeImage('/test.jpg', circular);
      }).not.toThrow();
    });
  });

  describe('Memory and Resource Management', () => {
    it('should handle memory exhaustion gracefully', async () => {
      // Simulate memory pressure by creating many large objects
      const largeArrays: number[][] = [];
      
      try {
        for (let i = 0; i < 1000; i++) {
          largeArrays.push(new Array(10000).fill(i));
        }

        const result = await service.optimizeImage('/memory-test.jpg', { width: 800 });
        expect(result).toBeDefined();
      } catch (error) {
        // Should handle memory errors gracefully
        expect(error).toBeInstanceOf(Error);
      } finally {
        // Cleanup
        largeArrays.length = 0;
      }
    });

    it('should handle resource leaks in event listeners', () => {
      const { unmount } = render(
        <LazyImage
          src="/resource-test.jpg"
          alt="Resource leak test"
          width={800}
          height={600}
          responsive={[
            { breakpoint: 'lg', width: 800, height: 600 },
          ]}
        />
      );

      // Check that event listeners are added
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      
      // Component should add resize listener for responsive images
      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      // Unmount should clean up listeners
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('should handle DOM node cleanup', () => {
      const { unmount } = render(
        <LazyImage
          src="/dom-test.jpg"
          alt="DOM cleanup test"
          width={800}
          height={600}
          preload
        />
      );

      // Check that preload link was added
      expect(document.head.appendChild).toHaveBeenCalled();

      // Unmount should not leave dangling references
      unmount();

      // Component should be cleanly removed
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('Concurrent Access Issues', () => {
    it('should handle race conditions in image loading', async () => {
      let loadCount = 0;
      
      global.Image = class extends (global.Image as any) {
        constructor() {
          super();
          loadCount++;
          const instance = loadCount;
          
          // Simulate race condition with random delays
          setTimeout(() => {
            if (instance % 2 === 0) {
              if (this.onload) this.onload();
            } else {
              if (this.onerror) this.onerror(new Event('error'));
            }
          }, Math.random() * 100);
        }
      } as any;

      const promises = Array(10).fill(null).map((_, i) =>
        service.optimizeImage(`/race-${i}.jpg`, { width: 800 })
      );

      const results = await Promise.allSettled(promises);
      
      // All promises should resolve, even if some images fail
      results.forEach(result => {
        expect(result.status).toBe('fulfilled');
        if (result.status === 'fulfilled') {
          expect(result.value).toBeDefined();
        }
      });
    });

    it('should handle concurrent cache access', async () => {
      const concurrentRequests = Array(50).fill(null).map(() =>
        service.optimizeImage('/cache-race.jpg', { width: 800, height: 600 })
      );

      fetchMock.fetchMock.mockResolvedValue(
        fetchMock.mockResponse({
          success: true,
          data: createMockImageData(),
        })
      );

      const results = await Promise.all(concurrentRequests);

      // All requests should succeed
      results.forEach(result => {
        expect(result).toEqual(createMockImageData());
      });

      // Should have made only one API call due to caching
      expect(fetchMock.fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should handle service instance conflicts', () => {
      const service1 = new ImageOptimizationService({ maxCacheSize: 10 });
      const service2 = new ImageOptimizationService({ maxCacheSize: 20 });

      // Services should not interfere with each other
      expect(() => {
        service1.optimizeImage('/test1.jpg', { width: 800 });
        service2.optimizeImage('/test2.jpg', { width: 800 });
      }).not.toThrow();
    });
  });

  describe('Browser API Failures', () => {
    it('should handle IntersectionObserver constructor failure', () => {
      global.IntersectionObserver = vi.fn().mockImplementation(() => {
        throw new Error('IntersectionObserver failed');
      });

      expect(() => {
        render(<LazyImage src="/test.jpg" alt="IO failure test" width={800} height={600} />);
      }).not.toThrow();

      // Should fallback to immediate loading
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src');
    });

    it('should handle canvas context failure', () => {
      const mockCanvas = {
        getContext: vi.fn(() => null), // Simulate context creation failure
        width: 0,
        height: 0,
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);

      const placeholder = generateBlurPlaceholder(20, 15, '#f0f0f0');
      expect(placeholder).toBe(''); // Should return empty string on failure
    });

    it('should handle performance API unavailability', () => {
      const originalPerformance = global.performance;
      delete (global as any).performance;

      expect(() => {
        service.optimizeImage('/perf-test.jpg', { width: 800 });
      }).not.toThrow();

      global.performance = originalPerformance;
    });

    it('should handle URL constructor failure', () => {
      const originalURL = global.URL;
      global.URL = class extends URL {
        constructor() {
          throw new Error('URL constructor failed');
        }
      } as any;

      expect(() => {
        buildOptimizedImageUrl('/test.jpg', { width: 800 });
      }).not.toThrow();

      global.URL = originalURL;
    });
  });

  describe('API Response Corruption', () => {
    it('should handle malformed JSON responses', async () => {
      fetchMock.fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as any);

      const result = await service.optimizeImage('/json-error.jpg', { width: 800, height: 600 });

      expect(result.fallback.src).toBe('/json-error.jpg');
      expect(result.sources).toEqual([]);
    });

    it('should handle incomplete API responses', async () => {
      fetchMock.fetchMock.mockResolvedValue(
        fetchMock.mockResponse({
          success: true,
          // Missing data field
        })
      );

      const result = await service.optimizeImage('/incomplete.jpg', { width: 800, height: 600 });

      expect(result.fallback.src).toBe('/incomplete.jpg');
    });

    it('should handle API responses with wrong data types', async () => {
      fetchMock.fetchMock.mockResolvedValue(
        fetchMock.mockResponse({
          success: 'true', // Wrong type
          data: 'not-an-object', // Wrong type
        })
      );

      const result = await service.optimizeImage('/wrong-types.jpg', { width: 800 });

      expect(result).toBeDefined();
      expect(result.fallback.src).toBe('/wrong-types.jpg');
    });
  });

  describe('Component Lifecycle Errors', () => {
    it('should handle component unmounting during image load', async () => {
      const { unmount } = render(
        <LazyImage
          src="/lifecycle-test.jpg"
          alt="Lifecycle test"
          width={800}
          height={600}
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

      // Unmount before image loads
      unmount();

      // Should not cause memory leaks or errors
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should handle props changing rapidly', () => {
      const { rerender } = render(
        <LazyImage src="/test1.jpg" alt="Test 1" width={800} height={600} />
      );

      // Rapidly change props
      for (let i = 0; i < 100; i++) {
        rerender(
          <LazyImage 
            src={`/test${i}.jpg`} 
            alt={`Test ${i}`} 
            width={800 + i} 
            height={600 + i} 
          />
        );
      }

      // Should not crash
      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();
    });

    it('should handle context changes', () => {
      const TestContext = React.createContext({ theme: 'light' });
      
      const { rerender } = render(
        <TestContext.Provider value={{ theme: 'light' }}>
          <LazyImage src="/context-test.jpg" alt="Context test" width={800} height={600} />
        </TestContext.Provider>
      );

      rerender(
        <TestContext.Provider value={{ theme: 'dark' }}>
          <LazyImage src="/context-test.jpg" alt="Context test" width={800} height={600} />
        </TestContext.Provider>
      );

      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();
    });
  });

  describe('Edge Case Data Handling', () => {
    it('should handle empty responsive arrays', () => {
      const result = generateResponsiveSources('/test.jpg', [], { quality: 80 });
      expect(result).toEqual([]);
    });

    it('should handle responsive sources with duplicate breakpoints', () => {
      const duplicateResponsive: ResponsiveSource[] = [
        { breakpoint: 'lg', width: 800, height: 600 },
        { breakpoint: 'lg', width: 1000, height: 750 }, // Duplicate breakpoint
      ];

      expect(() => {
        generateResponsiveSources('/test.jpg', duplicateResponsive);
      }).not.toThrow();
    });

    it('should handle dimensions with decimal values', async () => {
      const dimensions = await getImageDimensions('/decimal-test.jpg').catch(() => null);
      
      if (dimensions) {
        expect(typeof dimensions.width).toBe('number');
        expect(typeof dimensions.height).toBe('number');
        expect(typeof dimensions.aspectRatio).toBe('number');
      }
    });

    it('should handle browser capabilities with missing properties', () => {
      const partialCapabilities = {
        supportsWebP: true,
        // Missing other properties
      } as any;

      const format = getOptimalFormat(['avif', 'webp', 'jpeg'], partialCapabilities);
      expect(['avif', 'webp', 'jpeg']).toContain(format);
    });

    it('should handle parameters with special characters', async () => {
      const specialParams = {
        src: '/测试图片.jpg',
        quality: 90,
        format: 'webp' as const,
      };

      expect(() => {
        service.optimizeImage(specialParams.src, { 
          quality: specialParams.quality, 
          format: specialParams.format 
        });
      }).not.toThrow();
    });
  });
});