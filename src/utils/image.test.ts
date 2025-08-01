/**
 * Comprehensive unit tests for image utilities
 * Tests format detection, browser capabilities, responsive sources, and optimization helpers
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  detectBrowserCapabilities,
  getOptimalFormat,
  generateResponsiveSources,
  generateSizesAttribute,
  calculateAspectRatio,
  getDimensionsWithAspectRatio,
  generateBlurPlaceholder,
  buildOptimizedImageUrl,
  preloadImage,
  validateImageUrl,
  getImageDimensions,
  debounce,
  prefersReducedMotion,
  DEFAULT_BREAKPOINTS,
} from './image';
import type { 
  BrowserCapabilities, 
  ResponsiveSource, 
  ImageDimensions,
  ImageOptimizationParams 
} from '../types/image';
import { 
  createMockBrowserCapabilities,
  createMockResponsiveSource,
  setupImageTestMocks,
} from '../test/utils/test-utils';

describe('Image Utilities', () => {
  let mocks: ReturnType<typeof setupImageTestMocks>;

  beforeEach(() => {
    mocks = setupImageTestMocks();
  });

  afterEach(() => {
    mocks.cleanup();
  });

  describe('detectBrowserCapabilities', () => {
    it('should return default capabilities on server', () => {
      // Mock server environment
      const originalWindow = global.window;
      delete (global as any).window;

      const capabilities = detectBrowserCapabilities();
      
      expect(capabilities).toEqual({
        supportsWebP: false,
        supportsAVIF: false,
        supportsLazyLoading: false,
        supportsIntersectionObserver: false,
        devicePixelRatio: 1,
      });

      global.window = originalWindow;
    });

    it('should detect WebP support', () => {
      const mockCanvas = document.createElement('canvas');
      mockCanvas.toDataURL = vi.fn().mockReturnValue('data:image/webp;base64,test');
      
      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);

      const capabilities = detectBrowserCapabilities();
      expect(capabilities.supportsWebP).toBe(true);
    });

    it('should detect AVIF support', () => {
      const mockCanvas = document.createElement('canvas');
      mockCanvas.toDataURL = vi.fn().mockImplementation((type: string) => {
        if (type === 'image/avif') return 'data:image/avif;base64,test';
        return 'data:image/jpeg;base64,test';
      });
      
      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);

      const capabilities = detectBrowserCapabilities();
      expect(capabilities.supportsAVIF).toBe(true);
    });

    it('should detect lazy loading support', () => {
      const capabilities = detectBrowserCapabilities();
      expect(capabilities.supportsLazyLoading).toBe(true);
    });

    it('should detect IntersectionObserver support', () => {
      const capabilities = detectBrowserCapabilities();
      expect(capabilities.supportsIntersectionObserver).toBe(true);
    });

    it('should detect device pixel ratio', () => {
      Object.defineProperty(window, 'devicePixelRatio', { value: 2 });
      
      const capabilities = detectBrowserCapabilities();
      expect(capabilities.devicePixelRatio).toBe(2);
    });

    it('should detect connection type when available', () => {
      Object.defineProperty(navigator, 'connection', {
        value: { effectiveType: '3g' },
        configurable: true,
      });

      const capabilities = detectBrowserCapabilities();
      expect(capabilities.connectionType).toBe('3g');
    });

    it('should handle missing connection API gracefully', () => {
      Object.defineProperty(navigator, 'connection', {
        value: undefined,
        configurable: true,
      });

      const capabilities = detectBrowserCapabilities();
      expect(capabilities.connectionType).toBeUndefined();
    });
  });

  describe('getOptimalFormat', () => {
    it('should prefer AVIF when supported', () => {
      const capabilities = createMockBrowserCapabilities({
        supportsAVIF: true,
        supportsWebP: true,
      });

      const format = getOptimalFormat(['avif', 'webp', 'jpeg'], capabilities);
      expect(format).toBe('avif');
    });

    it('should fallback to WebP when AVIF not supported', () => {
      const capabilities = createMockBrowserCapabilities({
        supportsAVIF: false,
        supportsWebP: true,
      });

      const format = getOptimalFormat(['avif', 'webp', 'jpeg'], capabilities);
      expect(format).toBe('webp');
    });

    it('should fallback to JPEG when modern formats not supported', () => {
      const capabilities = createMockBrowserCapabilities({
        supportsAVIF: false,
        supportsWebP: false,
      });

      const format = getOptimalFormat(['avif', 'webp', 'jpeg'], capabilities);
      expect(format).toBe('jpeg');
    });

    it('should always return JPEG/PNG for legacy formats', () => {
      const capabilities = createMockBrowserCapabilities({
        supportsAVIF: false,
        supportsWebP: false,
      });

      expect(getOptimalFormat(['png'], capabilities)).toBe('png');
      expect(getOptimalFormat(['gif'], capabilities)).toBe('gif');
    });

    it('should use default capabilities when none provided', () => {
      const format = getOptimalFormat(['avif', 'webp', 'jpeg']);
      expect(['avif', 'webp', 'jpeg']).toContain(format);
    });

    it('should return jpeg as ultimate fallback', () => {
      const format = getOptimalFormat([]);
      expect(format).toBe('jpeg');
    });
  });

  describe('generateResponsiveSources', () => {
    const mockSources: ResponsiveSource[] = [
      { breakpoint: 'sm', width: 640, height: 480 },
      { breakpoint: 'md', width: 768, height: 576 },
      { breakpoint: 'lg', width: 1024, height: 768 },
    ];

    it('should generate responsive sources with optimal formats', () => {
      const sources = generateResponsiveSources('/test-image.jpg', mockSources);
      
      expect(sources).toHaveLength(3);
      sources.forEach((source) => {
        expect(source.format).toMatch(/avif|webp|jpeg/);
        expect(source.srcSet).toContain('1x');
        expect(source.srcSet).toContain('2x');
      });
    });

    it('should apply base parameters', () => {
      const baseParams = { quality: 90, fit: 'contain' as const };
      const sources = generateResponsiveSources('/test-image.jpg', mockSources, baseParams);
      
      sources.forEach((source) => {
        expect(source.quality).toBe(90);
      });
    });

    it('should override base parameters with source-specific ones', () => {
      const sourcesWithQuality: ResponsiveSource[] = [
        { breakpoint: 'sm', width: 640, quality: 95 },
      ];
      
      const sources = generateResponsiveSources('/test-image.jpg', sourcesWithQuality, { quality: 80 });
      expect(sources[0].quality).toBe(95);
    });

    it('should generate proper srcSet for different pixel densities', () => {
      const sources = generateResponsiveSources('/test-image.jpg', [mockSources[0]]);
      const srcSet = sources[0].srcSet;
      
      expect(srcSet).toContain('w=640');
      expect(srcSet).toContain('w=1280'); // 2x density
      expect(srcSet).toMatch(/1x.*2x/);
    });

    it('should generate sizes attribute', () => {
      const sources = generateResponsiveSources('/test-image.jpg', mockSources);
      
      sources.forEach((source) => {
        expect(source.sizes).toBeTruthy();
        expect(typeof source.sizes).toBe('string');
      });
    });

    it('should handle sources without height', () => {
      const sourcesNoHeight: ResponsiveSource[] = [
        { breakpoint: 'sm', width: 640 },
      ];
      
      const sources = generateResponsiveSources('/test-image.jpg', sourcesNoHeight);
      expect(sources[0].height).toBeTypeOf('number');
      expect(sources[0].height).toBeGreaterThan(0);
    });
  });

  describe('generateSizesAttribute', () => {
    it('should return "100vw" for empty responsive sources', () => {
      const sizes = generateSizesAttribute([]);
      expect(sizes).toBe('100vw');
    });

    it('should generate sizes in descending breakpoint order', () => {
      const sources: ResponsiveSource[] = [
        { breakpoint: 'sm', width: 640 },
        { breakpoint: 'lg', width: 1024 },
        { breakpoint: 'md', width: 768 },
      ];

      const sizes = generateSizesAttribute(sources);
      
      // Should start with largest breakpoint
      expect(sizes).toMatch(/^\(min-width: 1024px\)/);
      expect(sizes).toContain('(min-width: 768px)');
      expect(sizes).toContain('640px'); // Last size without media query
    });

    it('should handle single source correctly', () => {
      const sources: ResponsiveSource[] = [
        { breakpoint: 'md', width: 768 },
      ];

      const sizes = generateSizesAttribute(sources);
      expect(sizes).toBe('768px');
    });

    it('should use correct breakpoint values', () => {
      const sources: ResponsiveSource[] = [
        { breakpoint: 'xl', width: 1200 },
        { breakpoint: 'lg', width: 900 },
      ];

      const sizes = generateSizesAttribute(sources);
      expect(sizes).toContain(`(min-width: ${DEFAULT_BREAKPOINTS.xl}px)`);
      expect(sizes).toContain(`(min-width: ${DEFAULT_BREAKPOINTS.lg}px)`);
    });
  });

  describe('calculateAspectRatio', () => {
    it('should calculate aspect ratio correctly', () => {
      expect(calculateAspectRatio(800, 600)).toBe(800 / 600);
      expect(calculateAspectRatio(1920, 1080)).toBe(1920 / 1080);
      expect(calculateAspectRatio(1, 1)).toBe(1);
    });

    it('should handle edge cases', () => {
      expect(calculateAspectRatio(100, 1)).toBe(100);
      expect(calculateAspectRatio(1, 100)).toBe(0.01);
    });
  });

  describe('getDimensionsWithAspectRatio', () => {
    it('should calculate dimensions maintaining aspect ratio', () => {
      const original: ImageDimensions = { width: 800, height: 600 };
      const result = getDimensionsWithAspectRatio(400, original);
      
      expect(result.width).toBe(400);
      expect(result.height).toBe(300); // 400 * (600/800)
      expect(result.aspectRatio).toBe(800 / 600);
    });

    it('should use provided aspect ratio', () => {
      const original: ImageDimensions = { 
        width: 800, 
        height: 600, 
        aspectRatio: 16 / 9 
      };
      
      const result = getDimensionsWithAspectRatio(1600, original);
      
      expect(result.width).toBe(1600);
      expect(result.height).toBe(900); // 1600 / (16/9)
      expect(result.aspectRatio).toBe(16 / 9);
    });

    it('should round height to integers', () => {
      const original: ImageDimensions = { width: 100, height: 33 }; // Creates fractional result
      const result = getDimensionsWithAspectRatio(300, original);
      
      expect(result.height).toBe(Math.round(300 * (33 / 100)));
      expect(Number.isInteger(result.height)).toBe(true);
    });
  });

  describe('generateBlurPlaceholder', () => {
    it('should generate placeholder with default parameters', () => {
      const placeholder = generateBlurPlaceholder();
      
      expect(placeholder).toBeTruthy();
      expect(placeholder).toMatch(/^data:image\/(svg\+xml|jpeg);base64,/);
    });

    it('should generate placeholder with custom dimensions', () => {
      const placeholder = generateBlurPlaceholder(50, 50);
      expect(placeholder).toBeTruthy();
    });

    it('should generate placeholder with custom color', () => {
      const placeholder = generateBlurPlaceholder(10, 10, '#ff0000');
      expect(placeholder).toBeTruthy();
    });

    it('should return SVG fallback on server', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      const placeholder = generateBlurPlaceholder(20, 15, '#f3f4f6');
      
      expect(placeholder).toMatch(/^data:image\/svg\+xml;base64,/);
      expect(placeholder).toContain(btoa('<svg width="20" height="15"'));

      global.window = originalWindow;
    });

    it('should handle canvas generation in browser', () => {
      const placeholder = generateBlurPlaceholder(20, 15);
      expect(placeholder).toMatch(/^data:image\/jpeg;base64,/);
    });

    it('should handle canvas context not available', () => {
      const mockCanvas = {
        getContext: vi.fn(() => null),
      };
      
      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);

      const placeholder = generateBlurPlaceholder(10, 10);
      expect(placeholder).toBe('');
    });
  });

  describe('buildOptimizedImageUrl', () => {
    it('should build URL with basic parameters', () => {
      const params: ImageOptimizationParams = {
        width: 800,
        height: 600,
        quality: 90,
        format: 'webp',
        fit: 'cover',
      };

      const url = buildOptimizedImageUrl('/test-image.jpg', params);
      
      expect(url).toContain('w=800');
      expect(url).toContain('h=600');
      expect(url).toContain('q=90');
      expect(url).toContain('f=webp');
      expect(url).toContain('fit=cover');
    });

    it('should omit undefined parameters', () => {
      const params: ImageOptimizationParams = {
        width: 800,
        // height undefined
        quality: 80,
      };

      const url = buildOptimizedImageUrl('/test-image.jpg', params);
      
      expect(url).toContain('w=800');
      expect(url).not.toContain('h=');
      expect(url).toContain('q=80');
    });

    it('should include all optimization parameters', () => {
      const params: ImageOptimizationParams = {
        width: 800,
        height: 600,
        quality: 90,
        format: 'avif',
        fit: 'contain',
        blur: 5,
        brightness: 1.1,
        contrast: 1.2,
        saturation: 0.9,
      };

      const url = buildOptimizedImageUrl('/test-image.jpg', params);
      
      expect(url).toContain('blur=5');
      expect(url).toContain('brightness=1.1');
      expect(url).toContain('contrast=1.2');
      expect(url).toContain('saturation=0.9');
    });

    it('should use optimal format when format not specified', () => {
      const capabilities = createMockBrowserCapabilities({ supportsAVIF: true });
      const params: ImageOptimizationParams = { width: 800 };

      const url = buildOptimizedImageUrl('/test-image.jpg', params, capabilities);
      expect(url).toContain('f=avif');
    });

    it('should preserve base URL', () => {
      const baseUrl = '/api/images/test-image.jpg';
      const params: ImageOptimizationParams = { width: 800 };

      const url = buildOptimizedImageUrl(baseUrl, params);
      expect(url).toStartWith(baseUrl);
    });
  });

  describe('preloadImage', () => {
    it('should create preload link element', async () => {
      const appendChildSpy = vi.spyOn(document.head, 'appendChild');
      
      await preloadImage('/test-image.jpg');
      
      expect(appendChildSpy).toHaveBeenCalled();
      const linkElement = appendChildSpy.mock.calls[0][0] as HTMLLinkElement;
      expect(linkElement.rel).toBe('preload');
      expect(linkElement.as).toBe('image');
      expect(linkElement.href).toBe('/test-image.jpg');
      expect(linkElement.fetchPriority).toBe('high');
    });

    it('should set correct priority', async () => {
      const appendChildSpy = vi.spyOn(document.head, 'appendChild');
      
      await preloadImage('/test-image.jpg', 'low');
      
      const linkElement = appendChildSpy.mock.calls[0][0] as HTMLLinkElement;
      expect(linkElement.fetchPriority).toBe('low');
    });

    it('should resolve on successful load', async () => {
      const appendChildSpy = vi.spyOn(document.head, 'appendChild');
      
      const promise = preloadImage('/test-image.jpg');
      
      // Simulate load event
      const linkElement = appendChildSpy.mock.calls[0][0] as HTMLLinkElement;
      setTimeout(() => linkElement.onload && linkElement.onload(new Event('load')), 10);
      
      await expect(promise).resolves.toBeUndefined();
    });

    it('should reject on error', async () => {
      const appendChildSpy = vi.spyOn(document.head, 'appendChild');
      
      const promise = preloadImage('/invalid-image.jpg');
      
      // Simulate error event
      const linkElement = appendChildSpy.mock.calls[0][0] as HTMLLinkElement;
      setTimeout(() => linkElement.onerror && linkElement.onerror(new Event('error')), 10);
      
      await expect(promise).rejects.toThrow('Failed to preload image');
    });

    it('should resolve immediately on server', async () => {
      const originalWindow = global.window;
      delete (global as any).window;

      await expect(preloadImage('/test-image.jpg')).resolves.toBeUndefined();

      global.window = originalWindow;
    });
  });

  describe('validateImageUrl', () => {
    it('should validate accessible image URLs', async () => {
      const result = await validateImageUrl('/valid-image.jpg');
      expect(result).toBe(true);
    });

    it('should return false for inaccessible URLs', async () => {
      global.Image = class extends (global.Image as any) {
        constructor() {
          super();
          setTimeout(() => {
            if (this.onerror) this.onerror(new Event('error'));
          }, 10);
        }
      } as any;

      const result = await validateImageUrl('/invalid-image.jpg');
      expect(result).toBe(false);
    });

    it('should return true on server', async () => {
      const originalWindow = global.window;
      delete (global as any).window;

      const result = await validateImageUrl('/test-image.jpg');
      expect(result).toBe(true);

      global.window = originalWindow;
    });
  });

  describe('getImageDimensions', () => {
    it('should get image dimensions successfully', async () => {
      const dimensions = await getImageDimensions('/test-image.jpg');
      
      expect(dimensions.width).toBe(800);
      expect(dimensions.height).toBe(600);
      expect(dimensions.aspectRatio).toBe(800 / 600);
    });

    it('should reject on server', async () => {
      const originalWindow = global.window;
      delete (global as any).window;

      await expect(getImageDimensions('/test-image.jpg'))
        .rejects.toThrow('Cannot get image dimensions on server');

      global.window = originalWindow;
    });

    it('should reject on image load error', async () => {
      global.Image = class extends (global.Image as any) {
        constructor() {
          super();
          setTimeout(() => {
            if (this.onerror) this.onerror(new Event('error'));
          }, 10);
        }
      } as any;

      await expect(getImageDimensions('/invalid-image.jpg'))
        .rejects.toThrow('Failed to load image');
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);
      
      debouncedFn('arg1');
      debouncedFn('arg2');
      debouncedFn('arg3');
      
      expect(mockFn).not.toHaveBeenCalled();
      
      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(mockFn).toHaveBeenCalledOnce();
      expect(mockFn).toHaveBeenCalledWith('arg3');
    });

    it('should handle multiple debounced calls correctly', async () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 50);
      
      debouncedFn('first');
      await new Promise(resolve => setTimeout(resolve, 75));
      expect(mockFn).toHaveBeenCalledWith('first');
      
      debouncedFn('second');
      await new Promise(resolve => setTimeout(resolve, 75));
      expect(mockFn).toHaveBeenCalledWith('second');
      
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should preserve function context and arguments', async () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 50);
      
      debouncedFn('arg1', 'arg2', { key: 'value' });
      
      await new Promise(resolve => setTimeout(resolve, 75));
      
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', { key: 'value' });
    });
  });

  describe('prefersReducedMotion', () => {
    it('should return false when matchMedia not available', () => {
      const originalMatchMedia = window.matchMedia;
      delete (window as any).matchMedia;

      const result = prefersReducedMotion();
      expect(result).toBe(false);

      window.matchMedia = originalMatchMedia;
    });

    it('should return true when prefers-reduced-motion is set', () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: true });

      const result = prefersReducedMotion();
      expect(result).toBe(true);
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    });

    it('should return false when prefers-reduced-motion is not set', () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: false });

      const result = prefersReducedMotion();
      expect(result).toBe(false);
    });

    it('should return false on server', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      const result = prefersReducedMotion();
      expect(result).toBe(false);

      global.window = originalWindow;
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed URLs gracefully', () => {
      expect(() => {
        buildOptimizedImageUrl('not-a-url', { width: 800 });
      }).not.toThrow();
    });

    it('should handle extreme aspect ratios', () => {
      const veryWide = calculateAspectRatio(10000, 1);
      const veryTall = calculateAspectRatio(1, 10000);
      
      expect(veryWide).toBe(10000);
      expect(veryTall).toBe(0.0001);
    });

    it('should handle zero dimensions gracefully', () => {
      expect(() => {
        getDimensionsWithAspectRatio(0, { width: 800, height: 600 });
      }).not.toThrow();
    });

    it('should handle empty responsive sources', () => {
      const sources = generateResponsiveSources('/test.jpg', []);
      expect(sources).toEqual([]);
    });

    it('should handle browser capabilities with mixed support', () => {
      const capabilities: BrowserCapabilities = {
        supportsWebP: true,
        supportsAVIF: false,
        supportsLazyLoading: false,
        supportsIntersectionObserver: true,
        devicePixelRatio: 1.5,
        connectionType: '2g',
      };

      const format = getOptimalFormat(['avif', 'webp', 'jpeg'], capabilities);
      expect(format).toBe('webp');
    });
  });
});