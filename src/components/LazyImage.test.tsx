/**
 * Comprehensive tests for LazyImage React component
 * Tests lazy loading, IntersectionObserver, hooks, and performance features
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
// import userEvent from '@testing-library/user-event'; // Currently unused
import React from 'react';
import { LazyImage } from './LazyImage';
import type { LazyImageProps } from '../types/image';
import { 
  // createMockImageData, // Currently unused
  createMockResponsiveSource,
  setupImageTestMocks,
  axeTestHelper,
} from '../test/utils/test-utils';

describe('LazyImage Component', () => {
  let mocks: ReturnType<typeof setupImageTestMocks>;
  let mockObserver: any;

  beforeEach(() => {
    mocks = setupImageTestMocks();
    mockObserver = (global.IntersectionObserver as any).mock.instances[0];
  });

  afterEach(() => {
    mocks.cleanup();
  });

  const defaultProps: LazyImageProps = {
    src: '/test-image.jpg',
    alt: 'Test image',
    width: 800,
    height: 600,
  };

  describe('Basic Rendering', () => {
    it('should render with required props', () => {
      render(<LazyImage {...defaultProps} />);
      
      const container = screen.getByTestId('test-wrapper');
      expect(container).toBeInTheDocument();
      
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', 'Test image');
      expect(image).toHaveAttribute('width', '800');
      expect(image).toHaveAttribute('height', '600');
    });

    it('should apply custom className and styles', () => {
      const customProps = {
        ...defaultProps,
        className: 'custom-image',
        style: { border: '1px solid red' },
      };
      
      render(<LazyImage {...customProps} />);
      
      const container = screen.getByTestId('test-wrapper').firstChild as HTMLElement;
      expect(container).toHaveClass('lazy-image-container', 'custom-image');
      expect(container).toHaveStyle({ border: '1px solid red' });
    });

    it('should set up IntersectionObserver', () => {
      render(<LazyImage {...defaultProps} />);
      
      expect(global.IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          rootMargin: '50px',
          threshold: 0.1,
        })
      );
      
      expect(mockObserver.observe).toHaveBeenCalled();
    });

    it('should render placeholder when provided', () => {
      const props = {
        ...defaultProps,
        placeholder: true,
      };
      
      render(<LazyImage {...props} />);
      
      const placeholder = document.querySelector('.lazy-image-placeholder');
      expect(placeholder).toBeInTheDocument();
      expect(placeholder).toHaveAttribute('aria-hidden', 'true');
    });

    it('should render custom placeholder content', () => {
      const customPlaceholder = <div data-testid="custom-placeholder">Loading...</div>;
      const props = {
        ...defaultProps,
        placeholder: customPlaceholder,
      };
      
      render(<LazyImage {...props} />);
      
      const placeholder = screen.getByTestId('custom-placeholder');
      expect(placeholder).toBeInTheDocument();
      expect(placeholder).toHaveTextContent('Loading...');
    });
  });

  describe('Lazy Loading Behavior', () => {
    it('should not load image until intersection', () => {
      render(<LazyImage {...defaultProps} />);
      
      const image = screen.getByRole('img');
      expect(image).not.toHaveAttribute('src');
    });

    it('should load image when intersecting', async () => {
      render(<LazyImage {...defaultProps} />);
      
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

      await waitFor(() => {
        const image = screen.getByRole('img');
        expect(image).toHaveAttribute('src');
      });
    });

    it('should handle preload for critical resources', () => {
      render(<LazyImage {...defaultProps} criticalResource preload />);
      
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', '/test-image.jpg?w=800&h=600&q=80&f=avif&fit=cover');
    });

    it('should use custom loading configuration', () => {
      const loadingConfig = {
        rootMargin: '100px',
        threshold: 0.5,
        lazy: false,
      };
      
      render(<LazyImage {...defaultProps} loadingConfig={loadingConfig} />);
      
      expect(global.IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          rootMargin: '100px',
          threshold: 0.5,
        })
      );
      
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('loading', 'eager');
    });
  });

  describe('Image Loading States', () => {
    it('should show loading state initially', () => {
      render(<LazyImage {...defaultProps} showLoadingSpinner />);
      
      const container = screen.getByTestId('test-wrapper').firstChild as HTMLElement;
      expect(container).not.toHaveClass('lazy-image-loaded');
    });

    it('should transition to loaded state on successful load', async () => {
      render(<LazyImage {...defaultProps} />);
      
      // Trigger intersection to start loading
      act(() => {
        const callback = (global.IntersectionObserver as any).mock.calls[0][0];
        callback([{
          isIntersecting: true,
          target: document.querySelector('.lazy-image-container'),
        }]);
      });

      // Wait for image to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      await waitFor(() => {
        const container = screen.getByTestId('test-wrapper').firstChild as HTMLElement;
        expect(container).toHaveClass('lazy-image-loaded');
      });
    });

    it('should show error state on load failure', async () => {
      // Mock image load failure
      global.Image = class extends (global.Image as any) {
        constructor() {
          super();
          setTimeout(() => {
            if (this.onerror) this.onerror(new Event('error'));
          }, 10);
        }
      } as any;

      render(<LazyImage {...defaultProps} />);
      
      // Trigger intersection
      act(() => {
        const callback = (global.IntersectionObserver as any).mock.calls[0][0];
        callback([{
          isIntersecting: true,
          target: document.querySelector('.lazy-image-container'),
        }]);
      });

      await waitFor(() => {
        const container = screen.getByTestId('test-wrapper').firstChild as HTMLElement;
        expect(container).toHaveClass('lazy-image-error');
      });

      const errorState = screen.getByRole('img', { name: /image failed to load/i });
      expect(errorState).toBeInTheDocument();
    });

    it('should show loading spinner when enabled', () => {
      render(<LazyImage {...defaultProps} showLoadingSpinner />);
      
      // Trigger intersection to start loading
      act(() => {
        const callback = (global.IntersectionObserver as any).mock.calls[0][0];
        callback([{
          isIntersecting: true,
          target: document.querySelector('.lazy-image-container'),
        }]);
      });

      const spinner = document.querySelector('.lazy-image-spinner');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Responsive Images', () => {
    it('should render picture element with multiple sources', () => {
      const responsive = [
        createMockResponsiveSource({ breakpoint: 'sm', width: 640 }),
        createMockResponsiveSource({ breakpoint: 'lg', width: 1024 }),
      ];
      
      render(<LazyImage {...defaultProps} responsive={responsive} />);
      
      const picture = document.querySelector('picture');
      expect(picture).toBeInTheDocument();
      
      const sources = picture?.querySelectorAll('source');
      expect(sources).toHaveLength(2);
    });

    it('should generate correct srcSet for responsive sources', () => {
      const responsive = [
        createMockResponsiveSource({ breakpoint: 'md', width: 768, format: 'webp' }),
      ];
      
      render(<LazyImage {...defaultProps} responsive={responsive} />);
      
      // Trigger intersection
      act(() => {
        const callback = (global.IntersectionObserver as any).mock.calls[0][0];
        callback([{
          isIntersecting: true,
          target: document.querySelector('.lazy-image-container'),
        }]);
      });

      const source = document.querySelector('source');
      expect(source).toHaveAttribute('type', 'image/webp');
      expect(source?.getAttribute('srcset')).toContain('w=768');
    });

    it('should handle window resize for responsive images', async () => {
      const responsive = [
        createMockResponsiveSource({ breakpoint: 'sm', width: 640 }),
        createMockResponsiveSource({ breakpoint: 'lg', width: 1024 }),
      ];
      
      render(<LazyImage {...defaultProps} responsive={responsive} />);
      
      // Simulate window resize
      act(() => {
        window.__TEST_UTILS__.triggerResize(1200, 800);
      });

      // Should not throw or cause errors
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Retry Logic', () => {
    it('should retry loading on failure', async () => {
      let attempts = 0;
      global.Image = class extends (global.Image as any) {
        constructor() {
          super();
          attempts++;
          setTimeout(() => {
            if (attempts < 2 && this.onerror) {
              this.onerror(new Event('error'));
            } else if (this.onload) {
              this.onload();
            }
          }, 10);
        }
      } as any;

      const errorConfig = {
        retryAttempts: 3,
        retryDelay: 50,
      };
      
      render(<LazyImage {...defaultProps} errorConfig={errorConfig} />);
      
      // Trigger intersection
      act(() => {
        const callback = (global.IntersectionObserver as any).mock.calls[0][0];
        callback([{
          isIntersecting: true,
          target: document.querySelector('.lazy-image-container'),
        }]);
      });

      // Wait for retries
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      expect(attempts).toBeGreaterThan(1);
    });

    it('should use fallback image on error', async () => {
      const errorConfig = {
        fallbackSrc: '/fallback-image.jpg',
        retryAttempts: 1,
      };
      
      render(<LazyImage {...defaultProps} errorConfig={errorConfig} />);
      
      // Trigger intersection
      act(() => {
        const callback = (global.IntersectionObserver as any).mock.calls[0][0];
        callback([{
          isIntersecting: true,
          target: document.querySelector('.lazy-image-container'),
        }]);
      });

      // Simulate image error
      const image = screen.getByRole('img');
      act(() => {
        fireEvent.error(image);
      });

      await waitFor(() => {
        expect(image).toHaveAttribute('src', '/fallback-image.jpg');
      });
    });

    it('should call onError callback on failure', async () => {
      const onError = vi.fn();
      const errorConfig = { onError, retryAttempts: 1 };
      
      // Mock image load failure
      global.Image = class extends (global.Image as any) {
        constructor() {
          super();
          setTimeout(() => {
            if (this.onerror) this.onerror(new Event('error'));
          }, 10);
        }
      } as any;
      
      render(<LazyImage {...defaultProps} onError={onError} errorConfig={errorConfig} />);
      
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
        expect(errorConfig.onError).toHaveBeenCalledWith(expect.any(Error), 0);
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('should generate optimized image URLs', () => {
      const optimization = {
        quality: 90,
        format: 'webp' as const,
        fit: 'contain' as const,
      };
      
      render(<LazyImage {...defaultProps} optimization={optimization} />);
      
      // Trigger intersection
      act(() => {
        const callback = (global.IntersectionObserver as any).mock.calls[0][0];
        callback([{
          isIntersecting: true,
          target: document.querySelector('.lazy-image-container'),
        }]);
      });

      const image = screen.getByRole('img');
      const src = image.getAttribute('src');
      expect(src).toContain('q=90');
      expect(src).toContain('f=webp');
      expect(src).toContain('fit=contain');
    });

    it('should dispatch performance metrics on load', async () => {
      const onLoad = vi.fn();
      render(<LazyImage {...defaultProps} onLoad={onLoad} />);
      
      // Listen for custom performance event
      const performanceListener = vi.fn();
      document.addEventListener('lazy-image-loaded', performanceListener);
      
      // Trigger intersection and load
      act(() => {
        const callback = (global.IntersectionObserver as any).mock.calls[0][0];
        callback([{
          isIntersecting: true,
          target: document.querySelector('.lazy-image-container'),
        }]);
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      await waitFor(() => {
        expect(onLoad).toHaveBeenCalled();
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

    it('should preload images when enabled', () => {
      const appendChildSpy = vi.spyOn(document.head, 'appendChild');
      
      render(<LazyImage {...defaultProps} preload criticalResource />);
      
      expect(appendChildSpy).toHaveBeenCalled();
      const linkElement = appendChildSpy.mock.calls[0][0] as HTMLLinkElement;
      expect(linkElement.rel).toBe('preload');
      expect(linkElement.as).toBe('image');
      expect(linkElement.fetchPriority).toBe('high');
    });

    it('should handle reduced motion preference', () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: true });
      
      render(<LazyImage {...defaultProps} />);
      
      const image = screen.getByRole('img');
      expect(image).toHaveStyle({ transition: 'none' });
    });
  });

  describe('Intersection Observer Configuration', () => {
    it('should use custom intersection configuration', () => {
      const loadingConfig = {
        rootMargin: '200px',
        threshold: [0, 0.25, 0.5, 1],
      };
      
      render(<LazyImage {...defaultProps} loadingConfig={loadingConfig} />);
      
      expect(global.IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          rootMargin: '200px',
          threshold: [0, 0.25, 0.5, 1],
        })
      );
    });

    it('should call onIntersect callback', () => {
      const onIntersect = vi.fn();
      render(<LazyImage {...defaultProps} onIntersect={onIntersect} />);
      
      act(() => {
        const callback = (global.IntersectionObserver as any).mock.calls[0][0];
        callback([{
          isIntersecting: true,
          target: document.querySelector('.lazy-image-container'),
        }]);
      });

      expect(onIntersect).toHaveBeenCalledWith(true);
    });

    it('should handle IntersectionObserver fallback', () => {
      // Mock browsers without IntersectionObserver
      const originalIO = global.IntersectionObserver;
      delete (global as any).IntersectionObserver;
      
      render(<LazyImage {...defaultProps} />);
      
      // Image should load immediately as fallback
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src');
      
      global.IntersectionObserver = originalIO;
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const props = {
        ...defaultProps,
        role: 'banner',
        'aria-label': 'Hero image',
        'aria-describedby': 'image-description',
      };
      
      render(<LazyImage {...props} />);
      
      const image = screen.getByRole('banner');
      expect(image).toHaveAttribute('aria-label', 'Hero image');
      expect(image).toHaveAttribute('aria-describedby', 'image-description');
    });

    it('should have accessible error state', async () => {
      // Mock image load failure
      global.Image = class extends (global.Image as any) {
        constructor() {
          super();
          setTimeout(() => {
            if (this.onerror) this.onerror(new Event('error'));
          }, 10);
        }
      } as any;

      render(<LazyImage {...defaultProps} />);
      
      // Trigger intersection
      act(() => {
        const callback = (global.IntersectionObserver as any).mock.calls[0][0];
        callback([{
          isIntersecting: true,
          target: document.querySelector('.lazy-image-container'),
        }]);
      });

      await waitFor(() => {
        const errorState = screen.getByRole('img', { name: /image failed to load/i });
        expect(errorState).toBeInTheDocument();
        
        const screenReaderText = screen.getByText('Image failed to load');
        expect(screenReaderText).toHaveClass('sr-only');
      });
    });

    it('should pass accessibility tests', async () => {
      const { container } = render(<LazyImage {...defaultProps} />);
      
      const issues = await axeTestHelper(container);
      expect(issues).toHaveLength(0);
    });

    it('should handle missing alt text gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      render(<LazyImage src="/test.jpg" alt="" width={800} height={600} />);
      
      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to image element', () => {
      const ref = React.createRef<HTMLImageElement>();
      
      render(<LazyImage {...defaultProps} ref={ref} />);
      
      expect(ref.current).toBeInstanceOf(HTMLImageElement);
      expect(ref.current).toBe(screen.getByRole('img'));
    });

    it('should handle function refs', () => {
      const refCallback = vi.fn();
      
      render(<LazyImage {...defaultProps} ref={refCallback} />);
      
      expect(refCallback).toHaveBeenCalledWith(screen.getByRole('img'));
    });
  });

  describe('Cleanup', () => {
    it('should disconnect IntersectionObserver on unmount', () => {
      const { unmount } = render(<LazyImage {...defaultProps} />);
      
      unmount();
      
      expect(mockObserver.disconnect).toHaveBeenCalled();
    });

    it('should remove resize listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      const responsive = [createMockResponsiveSource()];
      
      const { unmount } = render(<LazyImage {...defaultProps} responsive={responsive} />);
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty src gracefully', () => {
      expect(() => {
        render(<LazyImage src="" alt="Empty source" width={800} height={600} />);
      }).not.toThrow();
    });

    it('should handle missing dimensions', () => {
      render(<LazyImage src="/test.jpg" alt="No dimensions" />);
      
      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();
    });

    it('should handle zero dimensions', () => {
      render(<LazyImage src="/test.jpg" alt="Zero dimensions" width={0} height={0} />);
      
      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();
    });

    it('should handle invalid optimization parameters', () => {
      const optimization = {
        quality: 150, // Invalid quality > 100
        format: 'invalid' as any,
      };
      
      expect(() => {
        render(<LazyImage {...defaultProps} optimization={optimization} />);
      }).not.toThrow();
    });

    it('should handle rapid intersection changes', () => {
      render(<LazyImage {...defaultProps} />);
      
      const callback = (global.IntersectionObserver as any).mock.calls[0][0];
      
      // Rapidly trigger intersection changes
      act(() => {
        callback([{ isIntersecting: true, target: document.querySelector('.lazy-image-container') }]);
        callback([{ isIntersecting: false, target: document.querySelector('.lazy-image-container') }]);
        callback([{ isIntersecting: true, target: document.querySelector('.lazy-image-container') }]);
      });

      // Should not cause errors
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });
});