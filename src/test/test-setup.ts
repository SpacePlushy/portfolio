import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Global test setup for image optimization system

// Mock browser APIs that are not available in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock performance API
Object.defineProperty(global, 'performance', {
  writable: true,
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
  },
});

// Mock Image constructor
global.Image = class MockImage {
  src = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 800;
  naturalHeight = 600;
  complete = false;

  constructor() {
    // Simulate async loading
    setTimeout(() => {
      this.complete = true;
      if (this.onload) {
        this.onload();
      }
    }, 10);
  }

  addEventListener(event: string, handler: () => void) {
    if (event === 'load') {
      this.onload = handler;
    } else if (event === 'error') {
      this.onerror = handler;
    }
  }

  removeEventListener() {
    // Mock implementation
  }

  dispatchEvent() {
    return true;
  }
} as any;

// Mock Canvas API
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(),
  putImageData: vi.fn(),
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  createRadialGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  drawImage: vi.fn(),
  fillStyle: '',
  strokeStyle: '',
});

HTMLCanvasElement.prototype.toDataURL = vi.fn(
  () => 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4w'
);

// Mock URL constructor for testing
global.URL = class MockURL {
  searchParams: URLSearchParams;
  origin: string;
  pathname: string;

  constructor(url: string, base?: string) {
    this.searchParams = new URLSearchParams();
    this.origin = base || 'http://localhost:3000';
    this.pathname = url.split('?')[0];

    const queryString = url.split('?')[1];
    if (queryString) {
      this.searchParams = new URLSearchParams(queryString);
    }
  }

  toString() {
    const params = this.searchParams.toString();
    return `${this.origin}${this.pathname}${params ? '?' + params : ''}`;
  }
} as any;

// Mock fetch for API testing
global.fetch = vi.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
    href: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
  },
  writable: true,
});

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = vi.fn();

// Mock CSS supports method
CSS.supports = vi.fn(() => true);

// Setup custom events for testing
global.CustomEvent = class MockCustomEvent extends Event {
  detail: any;

  constructor(type: string, options?: { detail?: any; bubbles?: boolean; cancelable?: boolean }) {
    super(type, options);
    this.detail = options?.detail;
  }
} as any;

// Mock navigator
Object.defineProperty(navigator, 'connection', {
  writable: true,
  value: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
  },
});

// Mock device pixel ratio
Object.defineProperty(window, 'devicePixelRatio', {
  writable: true,
  value: 1,
});

// Setup test environment variables
process.env.NODE_ENV = 'test';

// Global test utilities
declare global {
  interface Window {
    __TEST_UTILS__: {
      triggerIntersection: (element: Element, isIntersecting?: boolean) => void;
      triggerResize: (width: number, height: number) => void;
      mockImageLoad: (success?: boolean) => void;
    };
  }
}

window.__TEST_UTILS__ = {
  triggerIntersection: (element: Element, isIntersecting = true) => {
    const observer = (global.IntersectionObserver as any).mock.instances[0];
    if (observer && observer.callback) {
      observer.callback([
        {
          target: element,
          isIntersecting,
          intersectionRatio: isIntersecting ? 1 : 0,
          boundingClientRect: new DOMRect(),
          intersectionRect: new DOMRect(),
          rootBounds: new DOMRect(),
          time: performance.now(),
        },
      ]);
    }
  },

  triggerResize: (width: number, height: number) => {
    Object.defineProperty(window, 'innerWidth', { value: width, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: height, writable: true });
    window.dispatchEvent(new Event('resize'));
  },

  mockImageLoad: (success = true) => {
    const mockImage = global.Image as any;
    if (success && mockImage.prototype.onload) {
      mockImage.prototype.onload();
    } else if (!success && mockImage.prototype.onerror) {
      mockImage.prototype.onerror();
    }
  },
};

// Clean up function for tests
beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '';
});

afterEach(() => {
  vi.clearAllTimers();
});
