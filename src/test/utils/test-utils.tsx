/**
 * Test utilities for image optimization system
 * Provides mocks, helpers, and common test setup functions
 */

import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { vi } from 'vitest';
import type {
  ImageOptimizationParams,
  OptimizedImageData,
  BrowserCapabilities,
  ResponsiveSource,
  ImagePerformanceMetrics
} from '../../types/image';

// Mock data generators
export const createMockImageData = (overrides: Partial<OptimizedImageData> = {}): OptimizedImageData => ({
  sources: [
    {
      src: '/test-image-800.avif',
      srcSet: '/test-image-800.avif 1x, /test-image-1600.avif 2x',
      sizes: '(min-width: 1024px) 800px, 100vw',
      format: 'avif',
      width: 800,
      height: 600,
      quality: 80,
    },
    {
      src: '/test-image-800.webp',
      srcSet: '/test-image-800.webp 1x, /test-image-1600.webp 2x',
      sizes: '(min-width: 1024px) 800px, 100vw',
      format: 'webp',
      width: 800,
      height: 600,
      quality: 80,
    }
  ],
  fallback: {
    src: '/test-image-800.jpg',
    width: 800,
    height: 600,
  },
  placeholder: {
    src: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcU',
    width: 20,
    height: 15,
  },
  dimensions: {
    width: 800,
    height: 600,
    aspectRatio: 800 / 600,
  },
  ...overrides,
});

export const createMockBrowserCapabilities = (overrides: Partial<BrowserCapabilities> = {}): BrowserCapabilities => ({
  supportsWebP: true,
  supportsAVIF: true,
  supportsLazyLoading: true,
  supportsIntersectionObserver: true,
  devicePixelRatio: 1,
  connectionType: '4g',
  ...overrides,
});

export const createMockResponsiveSource = (overrides: Partial<ResponsiveSource> = {}): ResponsiveSource => ({
  breakpoint: 'lg',
  width: 800,
  height: 600,
  quality: 80,
  format: 'avif',
  ...overrides,
});

export const createMockPerformanceMetrics = (overrides: Partial<ImagePerformanceMetrics> = {}): ImagePerformanceMetrics => ({
  loadTime: 150,
  fileSize: 45000,
  format: 'avif',
  fromCache: false,
  renderTime: performance.now(),
  ...overrides,
});

// Mock implementations
export const mockIntersectionObserver = () => {
  const mockObserver = {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  };

  // Store original to restore later
  const originalIntersectionObserver = global.IntersectionObserver;

  global.IntersectionObserver = vi.fn().mockImplementation((callback: IntersectionObserverCallback) => {
    // Mock triggering intersection
    const mockTriggerIntersection = (isIntersecting: boolean = true) => {
      callback?.(
        [
          {
            isIntersecting,
            intersectionRatio: isIntersecting ? 1 : 0,
            target: document.createElement('div'),
            boundingClientRect: new DOMRect(),
            intersectionRect: new DOMRect(),
            rootBounds: new DOMRect(),
            time: performance.now(),
          },
        ],
        mockObserver
      );
    };

    // Add trigger method to mock for testing
    (mockObserver as any).mockTriggerIntersection = mockTriggerIntersection;

    return mockObserver;
  }) as any;

  return {
    mockObserver,
    restore: () => {
      global.IntersectionObserver = originalIntersectionObserver;
    },
  };
};

export const mockCanvas = () => {
  const mockContext = {
    fillRect: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    fillStyle: '',
  };

  const mockCanvas = {
    getContext: vi.fn(() => mockContext),
    toDataURL: vi.fn(() => 'data:image/jpeg;base64,mock-data'),
    width: 0,
    height: 0,
  };

  // Mock document.createElement for canvas
  const originalCreateElement = document.createElement;
  document.createElement = vi.fn().mockImplementation((tagName: string) => {
    if (tagName === 'canvas') {
      return mockCanvas;
    }
    return originalCreateElement.call(document, tagName);
  });

  return {
    mockCanvas,
    mockContext,
    restore: () => {
      document.createElement = originalCreateElement;
    },
  };
};

export const mockImage = () => {
  class MockImage {
    src = '';
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    naturalWidth = 800;
    naturalHeight = 600;

    constructor() {
      // Simulate async loading
      setTimeout(() => {
        if (this.src && this.onload) {
          this.onload();
        }
      }, 10);
    }

    // Method to trigger error for testing
    triggerError() {
      if (this.onerror) {
        this.onerror();
      }
    }
  }

  const originalImage = global.Image;
  global.Image = MockImage as any;

  return {
    MockImage,
    restore: () => {
      global.Image = originalImage;
    },
  };
};

export const mockFetch = () => {
  const mockResponse = (data: any, ok = true, status = 200) => ({
    ok,
    status,
    json: () => Promise.resolve(data),
    headers: new Headers(),
  });

  const fetchMock = vi.fn();
  global.fetch = fetchMock;

  return {
    fetchMock,
    mockResponse,
    restore: () => {
      vi.restoreAllMocks();
    },
  };
};

export const mockPerformance = () => {
  const originalPerformance = global.performance;

  global.performance = {
    ...originalPerformance,
    now: vi.fn(() => Date.now()),
  };

  return {
    restore: () => {
      global.performance = originalPerformance;
    },
  };
};

export const mockMatchMedia = () => {
  const originalMatchMedia = window.matchMedia;

  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  return {
    restore: () => {
      window.matchMedia = originalMatchMedia;
    },
  };
};

// Test wrapper component
interface TestWrapperProps {
  children: ReactNode;
}

const TestWrapper = ({ children }: TestWrapperProps) => {
  return <div data-testid="test-wrapper">{children}</div>;
};

// Custom render function with common providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: TestWrapper, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Test helper functions
export const waitForImageLoad = async (element: HTMLImageElement): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (element.complete) {
      resolve();
      return;
    }

    element.addEventListener('load', () => resolve());
    element.addEventListener('error', () => reject(new Error('Image failed to load')));
  });
};

export const simulateViewportChange = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });

  window.dispatchEvent(new Event('resize'));
};

export const createMockImageOptimizationParams = (
  overrides: Partial<ImageOptimizationParams> = {}
): ImageOptimizationParams => ({
  width: 800,
  height: 600,
  quality: 80,
  format: 'avif',
  fit: 'cover',
  ...overrides,
});

// Helper to create test URLs
export const createTestImageUrl = (params: Record<string, string | number> = {}) => {
  const url = new URL('/api/image-optimize', 'http://localhost:3000');
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });
  return url.toString();
};

// Setup all mocks for a test suite
export const setupImageTestMocks = () => {
  const intersectionObserver = mockIntersectionObserver();
  const canvas = mockCanvas();
  const image = mockImage();
  const fetch = mockFetch();
  const performance = mockPerformance();
  const matchMedia = mockMatchMedia();

  return {
    intersectionObserver,
    canvas,
    image,
    fetch,
    performance,
    matchMedia,
    cleanup: () => {
      intersectionObserver.restore();
      canvas.restore();
      image.restore();
      fetch.restore();
      performance.restore();
      matchMedia.restore();
    },
  };
};

// Utility to test accessibility
export const axeTestHelper = async (container: Element) => {
  // Note: This would typically use @axe-core/react in a real implementation
  // For now, we'll do basic accessibility checks
  const images = container.querySelectorAll('img');
  const issues: string[] = [];

  images.forEach((img, index) => {
    if (!img.getAttribute('alt')) {
      issues.push(`Image ${index + 1}: Missing alt attribute`);
    }
    
    const src = img.getAttribute('src');
    if (!src || src === '') {
      issues.push(`Image ${index + 1}: Missing or empty src attribute`);
    }
  });

  return issues;
};

// Performance test utilities
export const measureRenderTime = async (renderFn: () => Promise<void> | void): Promise<number> => {
  const start = performance.now();
  await renderFn();
  return performance.now() - start;
};

export const simulateSlowNetwork = () => {
  const originalFetch = global.fetch;
  
  global.fetch = vi.fn().mockImplementation((...args) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(originalFetch(...args));
      }, 2000); // 2 second delay
    });
  });

  return {
    restore: () => {
      global.fetch = originalFetch;
    },
  };
};

// Error simulation utilities
export const simulateNetworkError = () => {
  global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
};

export const simulateImageLoadError = () => {
  const mockImage = mockImage();
  
  // Override to always trigger error
  global.Image = class extends mockImage.MockImage {
    constructor() {
      super();
      setTimeout(() => {
        if (this.onerror) {
          this.onerror();
        }
      }, 10);
    }
  } as any;

  return mockImage;
};