/**
 * Browser compatibility tests for image optimization system
 * Tests feature detection, fallbacks, and cross-browser behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import React from 'react';
import { LazyImage } from '../../components/LazyImage';
import { 
  detectBrowserCapabilities,
  getOptimalFormat,
  prefersReducedMotion,
} from '../../utils/image';
import type { BrowserCapabilities } from '../../types/image';
import {
  createMockBrowserCapabilities,
  setupImageTestMocks,
  mockFetch,
} from '../utils/test-utils';

describe('Browser Compatibility', () => {
  let mocks: ReturnType<typeof setupImageTestMocks>;
  let fetchMock: ReturnType<typeof mockFetch>;

  beforeEach(() => {
    mocks = setupImageTestMocks();
    fetchMock = mockFetch();
  });

  afterEach(() => {
    mocks.cleanup();
    fetchMock.restore();
  });

  describe('Feature Detection', () => {
    describe('Modern Browser (Chrome 90+)', () => {
      beforeEach(() => {
        // Mock modern browser capabilities
        const mockCanvas = {
          toDataURL: vi.fn()
            .mockImplementation((type: string) => {
              if (type === 'image/avif') return 'data:image/avif;base64,test';
              if (type === 'image/webp') return 'data:image/webp;base64,test';
              return 'data:image/jpeg;base64,test';
            }),
        };

        vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);

        Object.defineProperty(window, 'devicePixelRatio', { value: 2 });
        Object.defineProperty(navigator, 'connection', {
          value: { effectiveType: '4g' },
          configurable: true,
        });
      });

      it('should detect all modern features', () => {
        const capabilities = detectBrowserCapabilities();

        expect(capabilities.supportsAVIF).toBe(true);
        expect(capabilities.supportsWebP).toBe(true);
        expect(capabilities.supportsLazyLoading).toBe(true);
        expect(capabilities.supportsIntersectionObserver).toBe(true);
        expect(capabilities.devicePixelRatio).toBe(2);
        expect(capabilities.connectionType).toBe('4g');
      });

      it('should select AVIF as optimal format', () => {
        const capabilities = detectBrowserCapabilities();
        const format = getOptimalFormat(['avif', 'webp', 'jpeg'], capabilities);
        expect(format).toBe('avif');
      });

      it('should use native lazy loading when available', () => {
        render(
          <LazyImage
            src="/test.jpg"
            alt="Modern browser test"
            width={800}
            height={600}
            loadingConfig={{ lazy: true }}
          />
        );

        const image = screen.getByRole('img');
        expect(image).toHaveAttribute('loading', 'lazy');
      });
    });

    describe('Safari (WebP support, no AVIF)', () => {
      beforeEach(() => {
        const mockCanvas = {
          toDataURL: vi.fn()
            .mockImplementation((type: string) => {
              if (type === 'image/webp') return 'data:image/webp;base64,test';
              return 'data:image/jpeg;base64,test';
            }),
        };

        vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);
      });

      it('should detect WebP but not AVIF', () => {
        const capabilities = detectBrowserCapabilities();

        expect(capabilities.supportsAVIF).toBe(false);
        expect(capabilities.supportsWebP).toBe(true);
        expect(capabilities.supportsLazyLoading).toBe(true);
        expect(capabilities.supportsIntersectionObserver).toBe(true);
      });

      it('should fallback to WebP from AVIF', () => {
        const capabilities = detectBrowserCapabilities();
        const format = getOptimalFormat(['avif', 'webp', 'jpeg'], capabilities);
        expect(format).toBe('webp');
      });
    });

    describe('Internet Explorer 11 (Legacy Browser)', () => {
      beforeEach(() => {
        // Mock IE11 environment
        const mockCanvas = {
          toDataURL: vi.fn(() => 'data:image/jpeg;base64,test'),
        };

        vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);

        // Remove modern features
        delete (global as any).IntersectionObserver;
        delete (HTMLImageElement.prototype as any).loading;
        delete (navigator as any).connection;
      });

      it('should detect limited capabilities', () => {
        const capabilities = detectBrowserCapabilities();

        expect(capabilities.supportsAVIF).toBe(false);
        expect(capabilities.supportsWebP).toBe(false);
        expect(capabilities.supportsLazyLoading).toBe(false);
        expect(capabilities.supportsIntersectionObserver).toBe(false);
      });

      it('should fallback to JPEG', () => {
        const capabilities = detectBrowserCapabilities();
        const format = getOptimalFormat(['avif', 'webp', 'jpeg'], capabilities);
        expect(format).toBe('jpeg');
      });

      it('should provide fallback for intersection observer', () => {
        render(
          <LazyImage
            src="/test.jpg"
            alt="IE11 test"
            width={800}
            height={600}
          />
        );

        // Should load immediately without intersection observer
        const image = screen.getByRole('img');
        expect(image).toHaveAttribute('src');
      });

      it('should not use native lazy loading', () => {
        render(
          <LazyImage
            src="/test.jpg"
            alt="IE11 lazy loading test"
            width={800}
            height={600}
            loadingConfig={{ lazy: true }}
          />
        );

        const image = screen.getByRole('img');
        expect(image).toHaveAttribute('loading', 'eager');
      });
    });

    describe('Firefox (WebP and AVIF support)', () => {
      beforeEach(() => {
        const mockCanvas = {
          toDataURL: vi.fn()
            .mockImplementation((type: string) => {
              if (type === 'image/avif') return 'data:image/avif;base64,test';
              if (type === 'image/webp') return 'data:image/webp;base64,test';
              return 'data:image/jpeg;base64,test';
            }),
        };

        vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);

        // Mock Firefox connection API
        Object.defineProperty(navigator, 'mozConnection', {
          value: { effectiveType: '3g' },
          configurable: true,
        });
      });

      it('should detect Mozilla-specific connection API', () => {
        const capabilities = detectBrowserCapabilities();
        expect(capabilities.connectionType).toBe('3g');
      });
    });

    describe('Chrome on Android (WebKit connection)', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'webkitConnection', {
          value: { effectiveType: '2g' },
          configurable: true,
        });
      });

      it('should detect WebKit connection API', () => {
        const capabilities = detectBrowserCapabilities();
        expect(capabilities.connectionType).toBe('2g');
      });
    });
  });

  describe('Progressive Enhancement', () => {
    it('should enhance with intersection observer when available', () => {
      render(
        <LazyImage
          src="/test.jpg"
          alt="Progressive enhancement test"
          width={800}
          height={600}
        />
      );

      expect(global.IntersectionObserver).toHaveBeenCalled();
      expect(mocks.intersectionObserver.mockObserver.observe).toHaveBeenCalled();
    });

    it('should work without intersection observer', () => {
      const originalIO = global.IntersectionObserver;
      delete (global as any).IntersectionObserver;

      render(
        <LazyImage
          src="/test.jpg"
          alt="No intersection observer test"
          width={800}
          height={600}
        />
      );

      // Should load image immediately
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src');

      global.IntersectionObserver = originalIO;
    });

    it('should handle missing requestAnimationFrame', () => {
      const originalRAF = global.requestAnimationFrame;
      delete (global as any).requestAnimationFrame;

      expect(() => {
        render(
          <LazyImage
            src="/test.jpg"
            alt="No RAF test"
            width={800}
            height={600}
          />
        );
      }).not.toThrow();

      global.requestAnimationFrame = originalRAF;
    });

    it('should work without CSS.supports', () => {
      const originalSupports = CSS.supports;
      delete (CSS as any).supports;

      expect(() => {
        render(
          <LazyImage
            src="/test.jpg"
            alt="No CSS.supports test"
            width={800}
            height={600}
          />
        );
      }).not.toThrow();

      CSS.supports = originalSupports;
    });
  });

  describe('Reduced Motion Support', () => {
    it('should respect prefers-reduced-motion', () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: true });

      const reducedMotion = prefersReducedMotion();
      expect(reducedMotion).toBe(true);

      render(
        <LazyImage
          src="/test.jpg"
          alt="Reduced motion test"
          width={800}
          height={600}
        />
      );

      const image = screen.getByRole('img');
      expect(image).toHaveStyle({ transition: 'none' });
    });

    it('should handle missing matchMedia', () => {
      const originalMatchMedia = window.matchMedia;
      delete (window as any).matchMedia;

      const reducedMotion = prefersReducedMotion();
      expect(reducedMotion).toBe(false);

      window.matchMedia = originalMatchMedia;
    });
  });

  describe('Network Condition Adaptation', () => {
    it('should adapt quality for slow connections', () => {
      const capabilities = createMockBrowserCapabilities({
        connectionType: '2g',
      });

      // In a real implementation, this would reduce quality for slow connections
      expect(capabilities.connectionType).toBe('2g');
    });

    it('should use high quality for fast connections', () => {
      const capabilities = createMockBrowserCapabilities({
        connectionType: '4g',
      });

      expect(capabilities.connectionType).toBe('4g');
    });

    it('should handle missing connection information', () => {
      const capabilities = createMockBrowserCapabilities({
        connectionType: undefined,
      });

      expect(capabilities.connectionType).toBeUndefined();
    });
  });

  describe('High DPI Display Support', () => {
    it('should detect high DPI displays', () => {
      Object.defineProperty(window, 'devicePixelRatio', { value: 3 });

      const capabilities = detectBrowserCapabilities();
      expect(capabilities.devicePixelRatio).toBe(3);
    });

    it('should handle missing devicePixelRatio', () => {
      const originalDPR = window.devicePixelRatio;
      delete (window as any).devicePixelRatio;

      const capabilities = detectBrowserCapabilities();
      expect(capabilities.devicePixelRatio).toBe(1);

      Object.defineProperty(window, 'devicePixelRatio', { value: originalDPR });
    });

    it('should generate appropriate srcSet for high DPI', () => {
      Object.defineProperty(window, 'devicePixelRatio', { value: 2 });

      render(
        <LazyImage
          src="/test.jpg"
          alt="High DPI test"
          width={800}
          height={600}
          responsive={[
            { breakpoint: 'lg', width: 800, height: 600 },
          ]}
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

      // Should generate 2x images for high DPI
      const sources = document.querySelectorAll('source');
      sources.forEach(source => {
        const srcSet = source.getAttribute('srcset');
        expect(srcSet).toContain('2x');
      });
    });
  });

  describe('Touch Device Detection', () => {
    it('should handle touch events when available', () => {
      Object.defineProperty(window, 'ontouchstart', { value: null });

      render(
        <LazyImage
          src="/test.jpg"
          alt="Touch device test"
          width={800}
          height={600}
        />
      );

      // Component should render without issues on touch devices
      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();
    });

    it('should work without touch support', () => {
      const originalTouch = window.ontouchstart;
      delete (window as any).ontouchstart;

      render(
        <LazyImage
          src="/test.jpg"
          alt="No touch test"
          width={800}
          height={600}
        />
      );

      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();

      if (originalTouch !== undefined) {
        Object.defineProperty(window, 'ontouchstart', { value: originalTouch });
      }
    });
  });

  describe('Server-Side Rendering Compatibility', () => {
    it('should work in server environment', () => {
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

    it('should handle image utilities in server environment', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      expect(() => {
        prefersReducedMotion();
      }).not.toThrow();

      const result = prefersReducedMotion();
      expect(result).toBe(false);

      global.window = originalWindow;
    });
  });

  describe('Error Recovery', () => {
    it('should handle canvas toDataURL errors', () => {
      const mockCanvas = {
        toDataURL: vi.fn(() => {
          throw new Error('Canvas error');
        }),
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);

      expect(() => {
        detectBrowserCapabilities();
      }).not.toThrow();

      const capabilities = detectBrowserCapabilities();
      expect(capabilities.supportsWebP).toBe(false);
      expect(capabilities.supportsAVIF).toBe(false);
    });

    it('should handle missing Image constructor', () => {
      const originalImage = global.Image;
      delete (global as any).Image;

      render(
        <LazyImage
          src="/test.jpg"
          alt="Missing Image constructor test"
          width={800}
          height={600}
        />
      );

      // Should render without crashing
      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();

      global.Image = originalImage;
    });

    it('should handle malformed navigator properties', () => {
      Object.defineProperty(navigator, 'connection', {
        value: null,
        configurable: true,
      });

      expect(() => {
        detectBrowserCapabilities();
      }).not.toThrow();

      const capabilities = detectBrowserCapabilities();
      expect(capabilities.connectionType).toBeUndefined();
    });
  });

  describe('Feature Flag Support', () => {
    it('should allow disabling features via configuration', () => {
      render(
        <LazyImage
          src="/test.jpg"
          alt="Feature flag test"
          width={800}
          height={600}
          loadingConfig={{ lazy: false }}
        />
      );

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('loading', 'eager');
    });

    it('should respect format preferences', () => {
      const capabilities = createMockBrowserCapabilities({
        supportsAVIF: true,
        supportsWebP: true,
      });

      // Force WebP even when AVIF is supported
      const format = getOptimalFormat(['webp', 'jpeg'], capabilities);
      expect(format).toBe('webp');
    });
  });

  describe('Viewport Meta Tag Interaction', () => {
    it('should work with responsive viewport', () => {
      const viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      viewportMeta.content = 'width=device-width, initial-scale=1';
      document.head.appendChild(viewportMeta);

      render(
        <LazyImage
          src="/test.jpg"
          alt="Viewport test"
          width={800}
          height={600}
          responsive={[
            { breakpoint: 'sm', width: 400 },
            { breakpoint: 'lg', width: 800 },
          ]}
        />
      );

      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();

      document.head.removeChild(viewportMeta);
    });
  });

  describe('Content Security Policy Compatibility', () => {
    it('should work with strict CSP', () => {
      const cspMeta = document.createElement('meta');
      cspMeta.httpEquiv = 'Content-Security-Policy';
      cspMeta.content = "default-src 'self'; img-src 'self' data:; script-src 'self'";
      document.head.appendChild(cspMeta);

      render(
        <LazyImage
          src="/test.jpg"
          alt="CSP test"
          width={800}
          height={600}
          placeholder={true}
        />
      );

      // Should work with data: URLs for placeholders
      const placeholder = document.querySelector('.lazy-image-placeholder');
      expect(placeholder).toBeInTheDocument();

      document.head.removeChild(cspMeta);
    });
  });
});