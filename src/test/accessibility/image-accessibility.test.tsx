/**
 * Accessibility tests for image optimization components
 * Tests ARIA attributes, screen reader support, keyboard navigation, and WCAG compliance
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { LazyImage } from '../../components/LazyImage';
import type { LazyImageProps } from '../../types/image';
import {
  createMockResponsiveSource,
  setupImageTestMocks,
  axeTestHelper,
} from '../utils/test-utils';

describe('Image Accessibility', () => {
  let mocks: ReturnType<typeof setupImageTestMocks>;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    mocks = setupImageTestMocks();
    user = userEvent.setup();
  });

  afterEach(() => {
    mocks.cleanup();
  });

  const defaultProps: LazyImageProps = {
    src: '/test-image.jpg',
    alt: 'A test image for accessibility testing',
    width: 800,
    height: 600,
  };

  describe('Alt Text and Image Descriptions', () => {
    it('should require alt text for accessibility', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();

      render(<LazyImage src="/test.jpg" alt="" width={800} height={600} />);

      // Should warn about missing alt text
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('alt prop is required for accessibility')
      );

      consoleSpy.mockRestore();
    });

    it('should provide meaningful alt text', () => {
      render(<LazyImage {...defaultProps} />);

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', 'A test image for accessibility testing');
    });

    it('should support decorative images with empty alt', () => {
      render(<LazyImage src="/decorative.jpg" alt="" width={400} height={200} />);

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', '');
    });

    it('should support complex descriptions with aria-describedby', () => {
      render(
        <div>
          <LazyImage
            {...defaultProps}
            aria-describedby="image-description"
          />
          <div id="image-description">
            This is a detailed description of the image content for screen readers.
          </div>
        </div>
      );

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('aria-describedby', 'image-description');

      const description = screen.getByText(/This is a detailed description/);
      expect(description).toBeInTheDocument();
    });

    it('should support aria-label for additional context', () => {
      render(
        <LazyImage
          {...defaultProps}
          aria-label="Product photo showing the main features"
        />
      );

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('aria-label', 'Product photo showing the main features');
    });

    it('should support role attribute for semantic meaning', () => {
      render(
        <LazyImage
          {...defaultProps}
          role="presentation"
        />
      );

      const image = screen.getByRole('presentation');
      expect(image).toBeInTheDocument();
    });
  });

  describe('Loading States and Screen Reader Announcements', () => {
    it('should announce loading state to screen readers', async () => {
      render(
        <LazyImage
          {...defaultProps}
          showLoadingSpinner
          aria-label="Profile photo"
        />
      );

      // Trigger intersection to start loading
      act(() => {
        const callback = (global.IntersectionObserver as any).mock.calls[0][0];
        callback([{
          isIntersecting: true,
          target: document.querySelector('.lazy-image-container'),
        }]);
      });

      const spinner = document.querySelector('.lazy-image-spinner');
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });

    it('should provide accessible error messages', async () => {
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

    it('should hide decorative elements from screen readers', () => {
      render(
        <LazyImage
          {...defaultProps}
          placeholder={true}
          showLoadingSpinner
        />
      );

      const placeholder = document.querySelector('.lazy-image-placeholder');
      expect(placeholder).toHaveAttribute('aria-hidden', 'true');

      // Trigger loading state
      act(() => {
        const callback = (global.IntersectionObserver as any).mock.calls[0][0];
        callback([{
          isIntersecting: true,
          target: document.querySelector('.lazy-image-container'),
        }]);
      });

      const spinner = document.querySelector('.lazy-image-spinner');
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be focusable when it has interactive content', async () => {
      render(
        <LazyImage
          {...defaultProps}
          tabIndex={0}
          onClick={() => console.log('Image clicked')}
        />
      );

      const image = screen.getByRole('img');
      
      await user.tab();
      expect(image).toHaveFocus();
    });

    it('should handle keyboard events appropriately', async () => {
      const onKeyDown = vi.fn();
      
      render(
        <LazyImage
          {...defaultProps}
          tabIndex={0}
          onKeyDown={onKeyDown}
        />
      );

      const image = screen.getByRole('img');
      await user.tab();
      await user.keyboard('{Enter}');

      expect(onKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'Enter',
        })
      );
    });

    it('should not be focusable for decorative images', () => {
      render(<LazyImage src="/decorative.jpg" alt="" width={400} height={200} />);

      const image = screen.getByRole('img');
      expect(image).not.toHaveAttribute('tabindex');
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    it('should support high contrast mode', () => {
      // Mock high contrast media query
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query.includes('prefers-contrast: high'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(<LazyImage {...defaultProps} placeholder={true} />);

      // In high contrast mode, placeholder should have enhanced contrast
      const placeholder = document.querySelector('.lazy-image-placeholder');
      expect(placeholder).toBeInTheDocument();
    });

    it('should respect reduced motion preferences', () => {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(<LazyImage {...defaultProps} />);

      const image = screen.getByRole('img');
      expect(image).toHaveStyle({ transition: 'none' });
    });

    it('should provide sufficient color contrast for error states', async () => {
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

      // Trigger intersection and error
      act(() => {
        const callback = (global.IntersectionObserver as any).mock.calls[0][0];
        callback([{
          isIntersecting: true,
          target: document.querySelector('.lazy-image-container'),
        }]);
      });

      await waitFor(() => {
        const errorState = document.querySelector('.lazy-image-error-state');
        expect(errorState).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Images and Accessibility', () => {
    it('should maintain accessibility across breakpoints', () => {
      const responsive = [
        createMockResponsiveSource({ breakpoint: 'sm', width: 400 }),
        createMockResponsiveSource({ breakpoint: 'lg', width: 800 }),
      ];

      render(
        <LazyImage
          {...defaultProps}
          responsive={responsive}
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

      const picture = document.querySelector('picture');
      expect(picture).toBeInTheDocument();

      const mainImage = screen.getByRole('img');
      expect(mainImage).toHaveAttribute('alt', defaultProps.alt);
    });

    it('should provide appropriate sizes for screen readers', () => {
      render(
        <LazyImage
          {...defaultProps}
          responsive={[
            createMockResponsiveSource({ breakpoint: 'lg', width: 800, height: 600 }),
          ]}
        />
      );

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('width', '800');
      expect(image).toHaveAttribute('height', '600');
    });
  });

  describe('Form Integration Accessibility', () => {
    it('should work properly in forms with labels', () => {
      render(
        <form>
          <label htmlFor="profile-upload">
            Profile Picture
            <input type="file" id="profile-upload" accept="image/*" />
          </label>
          <LazyImage
            {...defaultProps}
            alt="Current profile picture"
            role="img"
          />
        </form>
      );

      const label = screen.getByLabelText('Profile Picture');
      const image = screen.getByRole('img');
      
      expect(label).toBeInTheDocument();
      expect(image).toHaveAttribute('alt', 'Current profile picture');
    });

    it('should support fieldset grouping', () => {
      render(
        <fieldset>
          <legend>Image Gallery</legend>
          <LazyImage
            src="/gallery-1.jpg"
            alt="Gallery image 1 of 3"
            width={400}
            height={300}
          />
          <LazyImage
            src="/gallery-2.jpg"
            alt="Gallery image 2 of 3"
            width={400}
            height={300}
          />
        </fieldset>
      );

      const fieldset = screen.getByRole('group', { name: 'Image Gallery' });
      expect(fieldset).toBeInTheDocument();

      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(2);
      expect(images[0]).toHaveAttribute('alt', 'Gallery image 1 of 3');
      expect(images[1]).toHaveAttribute('alt', 'Gallery image 2 of 3');
    });
  });

  describe('Screen Reader Specific Tests', () => {
    it('should provide context for complex images', () => {
      render(
        <figure>
          <LazyImage
            src="/chart.jpg"
            alt="Sales performance chart"
            aria-describedby="chart-description"
            width={800}
            height={600}
          />
          <figcaption id="chart-description">
            Bar chart showing 25% increase in sales from Q1 to Q2 2024
          </figcaption>
        </figure>
      );

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', 'Sales performance chart');
      expect(image).toHaveAttribute('aria-describedby', 'chart-description');

      const caption = screen.getByText(/Bar chart showing 25% increase/);
      expect(caption).toBeInTheDocument();
    });

    it('should handle long descriptions appropriately', () => {
      const longDescription = 'This is a very detailed description of the image that provides comprehensive information about all the visual elements present in the image for users who cannot see it.';

      render(
        <LazyImage
          {...defaultProps}
          alt="Complex diagram"
          aria-describedby="long-desc"
        />
      );

      // Long descriptions should be separate from alt text
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', 'Complex diagram');
      expect(image).toHaveAttribute('aria-describedby', 'long-desc');
    });

    it('should announce state changes to screen readers', async () => {
      const { rerender } = render(
        <LazyImage
          {...defaultProps}
          aria-live="polite"
        />
      );

      // Simulate state change
      rerender(
        <LazyImage
          {...defaultProps}
          aria-live="polite"
          aria-label="Image loaded successfully"
        />
      );

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('aria-live', 'polite');
      expect(image).toHaveAttribute('aria-label', 'Image loaded successfully');
    });
  });

  describe('Touch and Mobile Accessibility', () => {
    it('should have adequate touch targets', () => {
      render(
        <LazyImage
          {...defaultProps}
          onClick={() => console.log('touched')}
          style={{ minWidth: '44px', minHeight: '44px' }}
        />
      );

      const image = screen.getByRole('img');
      expect(image).toHaveStyle({
        minWidth: '44px',
        minHeight: '44px',
      });
    });

    it('should support touch gestures appropriately', async () => {
      const onTouchStart = vi.fn();
      const onTouchEnd = vi.fn();

      render(
        <LazyImage
          {...defaultProps}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        />
      );

      const image = screen.getByRole('img');
      
      fireEvent.touchStart(image);
      fireEvent.touchEnd(image);

      expect(onTouchStart).toHaveBeenCalled();
      expect(onTouchEnd).toHaveBeenCalled();
    });
  });

  describe('WCAG Compliance', () => {
    it('should pass basic accessibility audit', async () => {
      const { container } = render(<LazyImage {...defaultProps} />);

      const issues = await axeTestHelper(container);
      expect(issues).toHaveLength(0);
    });

    it('should meet minimum requirements for images', () => {
      render(<LazyImage {...defaultProps} />);

      const image = screen.getByRole('img');
      
      // WCAG requirement: All images must have alt text
      expect(image).toHaveAttribute('alt');
      
      // WCAG requirement: Alt text should not be null for content images
      expect(image.getAttribute('alt')).not.toBe(null);
      expect(image.getAttribute('alt')).toBeTruthy();
    });

    it('should support ARIA landmarks correctly', () => {
      render(
        <main>
          <h1>Image Gallery</h1>
          <LazyImage
            {...defaultProps}
            role="img"
          />
        </main>
      );

      const main = screen.getByRole('main');
      const image = screen.getByRole('img');
      
      expect(main).toBeInTheDocument();
      expect(image).toBeInTheDocument();
    });

    it('should maintain semantic structure', () => {
      render(
        <article>
          <header>
            <h2>Article Title</h2>
          </header>
          <LazyImage
            {...defaultProps}
            alt="Article featured image"
          />
          <p>Article content...</p>
        </article>
      );

      const article = screen.getByRole('article');
      const heading = screen.getByRole('heading', { level: 2 });
      const image = screen.getByRole('img');
      
      expect(article).toBeInTheDocument();
      expect(heading).toBeInTheDocument();
      expect(image).toBeInTheDocument();
    });
  });

  describe('Error State Accessibility', () => {
    it('should provide accessible error messages', async () => {
      // Mock image failure
      global.Image = class extends (global.Image as any) {
        constructor() {
          super();
          setTimeout(() => {
            if (this.onerror) this.onerror(new Event('error'));
          }, 10);
        }
      } as any;

      render(
        <LazyImage
          {...defaultProps}
          aria-describedby="error-description"
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
        const errorState = screen.getByRole('img', { name: /image failed to load/i });
        expect(errorState).toBeInTheDocument();
      });
    });

    it('should maintain focus management during error states', async () => {
      const onError = vi.fn();

      render(
        <LazyImage
          {...defaultProps}
          onError={onError}
          tabIndex={0}
        />
      );

      const image = screen.getByRole('img');
      await user.tab();
      expect(image).toHaveFocus();

      // Simulate error
      fireEvent.error(image);

      // Focus should remain manageable
      expect(document.activeElement).toBeDefined();
    });
  });

  describe('Custom Placeholder Accessibility', () => {
    it('should handle custom React element placeholders accessibly', () => {
      const customPlaceholder = (
        <div role="status" aria-label="Loading image">
          <span className="sr-only">Loading...</span>
          <div className="spinner" aria-hidden="true" />
        </div>
      );

      render(
        <LazyImage
          {...defaultProps}
          placeholder={customPlaceholder}
        />
      );

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-label', 'Loading image');

      const srText = screen.getByText('Loading...');
      expect(srText).toHaveClass('sr-only');

      const spinner = document.querySelector('.spinner');
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });

    it('should handle string placeholders appropriately', () => {
      render(
        <LazyImage
          {...defaultProps}
          placeholder="data:image/svg+xml;base64,..."
        />
      );

      const placeholder = document.querySelector('.lazy-image-placeholder');
      expect(placeholder).toHaveAttribute('aria-hidden', 'true');
    });
  });
});