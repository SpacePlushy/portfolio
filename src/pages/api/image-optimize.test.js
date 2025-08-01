/**
 * Comprehensive tests for image optimization API endpoints
 * Tests GET, POST, OPTIONS methods with various parameters and edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST, OPTIONS } from './image-optimize.js';

// Mock the image utilities
vi.mock('../../utils/image.js', () => ({
  getOptimalFormat: vi.fn((formats, capabilities) => {
    if (capabilities?.supportsAVIF) return 'avif';
    if (capabilities?.supportsWebP) return 'webp';
    return 'jpeg';
  }),
  generateResponsiveSources: vi.fn((src, breakpoints, params) => 
    breakpoints.map(bp => ({
      src: `${src}?w=${bp.width}&q=${params.quality || 80}&f=${params.format || 'jpeg'}`,
      srcSet: `${src}?w=${bp.width}&q=${params.quality || 80}&f=${params.format || 'jpeg'} 1x, ${src}?w=${bp.width * 2}&q=${params.quality || 80}&f=${params.format || 'jpeg'} 2x`,
      sizes: `(min-width: ${bp.width}px) ${bp.width}px, 100vw`,
      format: params.format || 'jpeg',
      width: bp.width,
      height: bp.height || Math.round(bp.width * 0.75),
      quality: params.quality || 80,
    }))
  ),
  buildOptimizedImageUrl: vi.fn((src, params) => {
    const url = new URL('http://example.com' + src);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        const paramKey = key === 'width' ? 'w' : key === 'height' ? 'h' : key === 'quality' ? 'q' : key === 'format' ? 'f' : key;
        url.searchParams.set(paramKey, String(value));
      }
    });
    return url.pathname + url.search;
  }),
  generateBlurPlaceholder: vi.fn((width, height, color) => 
    `data:image/svg+xml;base64,${btoa(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${color}"/></svg>`)}`
  ),
}));

describe('Image Optimize API', () => {
  let mockRequest;
  let mockUrl;

  beforeEach(() => {
    mockRequest = {
      headers: new Map([
        ['accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'],
      ]),
      json: vi.fn(),
    };

    // Mock console methods
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/image-optimize', () => {
    describe('Parameter Validation', () => {
      it('should return 400 for missing src parameter', async () => {
        mockUrl = new URL('http://localhost:3000/api/image-optimize');
        
        const response = await GET({ request: mockRequest, url: mockUrl });
        const data = await response.json();
        
        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('VALIDATION_ERROR');
        expect(data.error.details).toContain('src parameter is required');
      });

      it('should return 400 for invalid width parameter', async () => {
        mockUrl = new URL('http://localhost:3000/api/image-optimize?src=/test.jpg&w=0');
        
        const response = await GET({ request: mockRequest, url: mockUrl });
        const data = await response.json();
        
        expect(response.status).toBe(400);
        expect(data.error.details).toContain('width must be a positive number <= 4000');
      });

      it('should return 400 for invalid height parameter', async () => {
        mockUrl = new URL('http://localhost:3000/api/image-optimize?src=/test.jpg&h=5000');
        
        const response = await GET({ request: mockRequest, url: mockUrl });
        const data = await response.json();
        
        expect(response.status).toBe(400);
        expect(data.error.details).toContain('height must be a positive number <= 4000');
      });

      it('should return 400 for invalid quality parameter', async () => {
        mockUrl = new URL('http://localhost:3000/api/image-optimize?src=/test.jpg&q=150');
        
        const response = await GET({ request: mockRequest, url: mockUrl });
        const data = await response.json();
        
        expect(response.status).toBe(400);
        expect(data.error.details).toContain('quality must be between 1 and 100');
      });

      it('should return 400 for invalid format parameter', async () => {
        mockUrl = new URL('http://localhost:3000/api/image-optimize?src=/test.jpg&f=invalid');
        
        const response = await GET({ request: mockRequest, url: mockUrl });
        const data = await response.json();
        
        expect(response.status).toBe(400);
        expect(data.error.details).toContain('format must be one of: avif, webp, jpeg, png, gif');
      });

      it('should return 400 for invalid fit parameter', async () => {
        mockUrl = new URL('http://localhost:3000/api/image-optimize?src=/test.jpg&fit=invalid');
        
        const response = await GET({ request: mockRequest, url: mockUrl });
        const data = await response.json();
        
        expect(response.status).toBe(400);
        expect(data.error.details).toContain('fit must be one of: contain, cover, fill, none, scale-down');
      });

      it('should accept valid parameters', async () => {
        mockUrl = new URL('http://localhost:3000/api/image-optimize?src=/test.jpg&w=800&h=600&q=90&f=webp&fit=cover');
        
        const response = await GET({ request: mockRequest, url: mockUrl });
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });
    });

    describe('Browser Capability Detection', () => {
      it('should detect AVIF support from Accept header', async () => {
        mockRequest.headers.set('accept', 'image/avif,image/webp,*/*');
        mockUrl = new URL('http://localhost:3000/api/image-optimize?src=/test.jpg&w=800');
        
        const response = await GET({ request: mockRequest, url: mockUrl });
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data.metrics.browserCapabilities.supportsAVIF).toBe(true);
        expect(data.data.fallback.src).toContain('f=avif');
      });

      it('should detect WebP support from Accept header', async () => {
        mockRequest.headers.set('accept', 'image/webp,*/*');
        mockUrl = new URL('http://localhost:3000/api/image-optimize?src=/test.jpg&w=800');
        
        const response = await GET({ request: mockRequest, url: mockUrl });
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data.metrics.browserCapabilities.supportsWebP).toBe(true);
        expect(data.data.fallback.src).toContain('f=webp');
      });

      it('should fallback to JPEG when modern formats not supported', async () => {
        mockRequest.headers.set('accept', 'text/html,*/*');
        mockUrl = new URL('http://localhost:3000/api/image-optimize?src=/test.jpg&w=800');
        
        const response = await GET({ request: mockRequest, url: mockUrl });
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data.metrics.browserCapabilities.supportsAVIF).toBe(false);
        expect(data.metrics.browserCapabilities.supportsWebP).toBe(false);
        expect(data.data.fallback.src).toContain('f=jpeg');
      });

      it('should handle missing Accept header', async () => {
        mockRequest.headers.set('accept', '');
        mockUrl = new URL('http://localhost:3000/api/image-optimize?src=/test.jpg&w=800');
        
        const response = await GET({ request: mockRequest, url: mockUrl });
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data.metrics.browserCapabilities).toBeDefined();
      });
    });

    describe('Image Optimization', () => {
      it('should generate optimized image URL with basic parameters', async () => {
        mockUrl = new URL('http://localhost:3000/api/image-optimize?src=/test.jpg&w=800&h=600&q=85');
        
        const response = await GET({ request: mockRequest, url: mockUrl });
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.fallback.src).toContain('w=800');
        expect(data.data.fallback.src).toContain('h=600');
        expect(data.data.fallback.src).toContain('q=85');
        expect(data.data.dimensions.width).toBe(800);
        expect(data.data.dimensions.height).toBe(600);
      });

      it('should generate responsive sources when requested', async () => {
        mockUrl = new URL('http://localhost:3000/api/image-optimize?src=/test.jpg&w=1200&h=800&responsive=true');
        
        const response = await GET({ request: mockRequest, url: mockUrl });
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data.data.sources).toBeDefined();
        expect(data.data.sources.length).toBeGreaterThan(0);
        
        // Check responsive sources have correct structure
        data.data.sources.forEach(source => {
          expect(source).toHaveProperty('src');
          expect(source).toHaveProperty('srcSet');
          expect(source).toHaveProperty('sizes');
          expect(source).toHaveProperty('format');
          expect(source).toHaveProperty('width');
          expect(source).toHaveProperty('height');
        });
      });

      it('should generate placeholder when requested', async () => {
        mockUrl = new URL('http://localhost:3000/api/image-optimize?src=/test.jpg&w=800&h=600&placeholder=true');
        
        const response = await GET({ request: mockRequest, url: mockUrl });
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data.data.placeholder).toBeDefined();
        expect(data.data.placeholder.src).toMatch(/^data:image\/svg\+xml;base64,/);
        expect(data.data.placeholder.width).toBe(20);
        expect(data.data.placeholder.height).toBe(15);
      });

      it('should include all optimization parameters in URL', async () => {
        mockUrl = new URL('http://localhost:3000/api/image-optimize?src=/test.jpg&w=800&h=600&q=90&f=webp&fit=contain&blur=5&brightness=1.1&contrast=1.2&saturation=0.9');
        
        const response = await GET({ request: mockRequest, url: mockUrl });
        const data = await response.json();
        
        expect(response.status).toBe(200);
        const optimizedUrl = data.data.fallback.src;
        expect(optimizedUrl).toContain('blur=5');
        expect(optimizedUrl).toContain('brightness=1.1');
        expect(optimizedUrl).toContain('contrast=1.2');
        expect(optimizedUrl).toContain('saturation=0.9');
      });
    });

    describe('Response Format', () => {
      it('should return correct response structure', async () => {
        mockUrl = new URL('http://localhost:3000/api/image-optimize?src=/test.jpg&w=800&h=600');
        
        const response = await GET({ request: mockRequest, url: mockUrl });
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data).toHaveProperty('success', true);
        expect(data).toHaveProperty('data');
        expect(data).toHaveProperty('metrics');
        
        expect(data.data).toHaveProperty('sources');
        expect(data.data).toHaveProperty('fallback');
        expect(data.data).toHaveProperty('dimensions');
        
        expect(data.metrics).toHaveProperty('processingTime');
        expect(data.metrics).toHaveProperty('format');
        expect(data.metrics).toHaveProperty('browserCapabilities');
      });

      it('should set correct cache headers', async () => {
        mockUrl = new URL('http://localhost:3000/api/image-optimize?src=/test.jpg&w=800');
        
        const response = await GET({ request: mockRequest, url: mockUrl });
        
        expect(response.headers.get('Content-Type')).toBe('application/json');
        expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600, s-maxage=86400');
        expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      });

      it('should calculate aspect ratio correctly', async () => {
        mockUrl = new URL('http://localhost:3000/api/image-optimize?src=/test.jpg&w=1600&h=900');
        
        const response = await GET({ request: mockRequest, url: mockUrl });
        const data = await response.json();
        
        expect(data.data.dimensions.aspectRatio).toBeCloseTo(1600 / 900, 10);
      });
    });

    describe('Error Handling', () => {
      it('should handle internal server errors gracefully', async () => {
        // Mock an error in the optimization process
        const { buildOptimizedImageUrl } = await import('../../utils/image.js');
        buildOptimizedImageUrl.mockImplementationOnce(() => {
          throw new Error('Mock optimization error');
        });

        mockUrl = new URL('http://localhost:3000/api/image-optimize?src=/test.jpg&w=800');
        
        const response = await GET({ request: mockRequest, url: mockUrl });
        const data = await response.json();
        
        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('INTERNAL_ERROR');
        expect(data.error.message).toBe('Internal server error');
      });

      it('should include error details in development', async () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';

        const { buildOptimizedImageUrl } = await import('../../utils/image.js');
        buildOptimizedImageUrl.mockImplementationOnce(() => {
          throw new Error('Mock optimization error');
        });

        mockUrl = new URL('http://localhost:3000/api/image-optimize?src=/test.jpg&w=800');
        
        const response = await GET({ request: mockRequest, url: mockUrl });
        const data = await response.json();
        
        expect(response.status).toBe(500);
        expect(data.error.details).toBe('Mock optimization error');

        process.env.NODE_ENV = originalEnv;
      });

      it('should not include error details in production', async () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        const { buildOptimizedImageUrl } = await import('../../utils/image.js');
        buildOptimizedImageUrl.mockImplementationOnce(() => {
          throw new Error('Mock optimization error');
        });

        mockUrl = new URL('http://localhost:3000/api/image-optimize?src=/test.jpg&w=800');
        
        const response = await GET({ request: mockRequest, url: mockUrl });
        const data = await response.json();
        
        expect(response.status).toBe(500);
        expect(data.error.details).toBeUndefined();

        process.env.NODE_ENV = originalEnv;
      });
    });
  });

  describe('POST /api/image-optimize', () => {
    describe('Request Validation', () => {
      it('should return 400 for missing images array', async () => {
        mockRequest.json.mockResolvedValue({});
        
        const response = await POST({ request: mockRequest });
        const data = await response.json();
        
        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('INVALID_BODY');
        expect(data.error.message).toBe('Request body must contain an "images" array');
      });

      it('should return 400 if images is not an array', async () => {
        mockRequest.json.mockResolvedValue({ images: 'not-an-array' });
        
        const response = await POST({ request: mockRequest });
        const data = await response.json();
        
        expect(response.status).toBe(400);
        expect(data.error.code).toBe('INVALID_BODY');
      });

      it('should return 400 for too many images', async () => {
        const images = Array(11).fill({ src: '/test.jpg', width: 800 });
        mockRequest.json.mockResolvedValue({ images });
        
        const response = await POST({ request: mockRequest });
        const data = await response.json();
        
        expect(response.status).toBe(400);
        expect(data.error.code).toBe('TOO_MANY_IMAGES');
        expect(data.error.message).toBe('Maximum 10 images per batch request');
      });

      it('should accept valid batch request', async () => {
        const images = [
          { src: '/test1.jpg', width: 800, height: 600 },
          { src: '/test2.jpg', width: 400, height: 300 },
        ];
        mockRequest.json.mockResolvedValue({ images });
        
        const response = await POST({ request: mockRequest });
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toHaveLength(2);
      });
    });

    describe('Batch Processing', () => {
      it('should process multiple images successfully', async () => {
        const images = [
          { src: '/test1.jpg', width: 800, height: 600, quality: 90 },
          { src: '/test2.jpg', width: 400, height: 300, quality: 80 },
          { src: '/test3.jpg', width: 1200, height: 800, responsive: true },
        ];
        mockRequest.json.mockResolvedValue({ images });
        
        const response = await POST({ request: mockRequest });
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toHaveLength(3);
        
        // Check each processed image
        data.data.forEach((result, index) => {
          expect(result.success).toBe(true);
          expect(result.data).toHaveProperty('sources');
          expect(result.data).toHaveProperty('fallback');
          expect(result.data).toHaveProperty('dimensions');
          expect(result.data.dimensions.width).toBe(images[index].width);
        });
      });

      it('should handle individual image validation errors', async () => {
        const images = [
          { src: '/test1.jpg', width: 800, height: 600 }, // Valid
          { src: '', width: 400 }, // Invalid - missing src
          { src: '/test3.jpg', width: 0 }, // Invalid - invalid width
        ];
        mockRequest.json.mockResolvedValue({ images });
        
        const response = await POST({ request: mockRequest });
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toHaveLength(3);
        
        expect(data.data[0].success).toBe(true);
        expect(data.data[1].success).toBe(false);
        expect(data.data[1].error.code).toBe('VALIDATION_ERROR');
        expect(data.data[2].success).toBe(false);
        expect(data.data[2].error.code).toBe('VALIDATION_ERROR');
      });

      it('should handle processing errors for individual images', async () => {
        const { buildOptimizedImageUrl } = await import('../../utils/image.js');
        
        // Mock error for second image only
        buildOptimizedImageUrl.mockImplementation((src) => {
          if (src === '/error.jpg') {
            throw new Error('Processing error');
          }
          return `/optimized${src}?w=800&q=80&f=jpeg`;
        });

        const images = [
          { src: '/test1.jpg', width: 800 },
          { src: '/error.jpg', width: 800 },
          { src: '/test3.jpg', width: 800 },
        ];
        mockRequest.json.mockResolvedValue({ images });
        
        const response = await POST({ request: mockRequest });
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data.data[0].success).toBe(true);
        expect(data.data[1].success).toBe(false);
        expect(data.data[1].error.code).toBe('PROCESSING_ERROR');
        expect(data.data[2].success).toBe(true);
      });

      it('should generate responsive sources for batch requests', async () => {
        const images = [
          { src: '/test1.jpg', width: 1200, height: 800, responsive: true },
          { src: '/test2.jpg', width: 800, height: 600, responsive: true },
        ];
        mockRequest.json.mockResolvedValue({ images });
        
        const response = await POST({ request: mockRequest });
        const data = await response.json();
        
        expect(response.status).toBe(200);
        data.data.forEach(result => {
          expect(result.success).toBe(true);
          expect(result.data.sources).toBeDefined();
          expect(result.data.sources.length).toBeGreaterThan(0);
        });
      });
    });

    describe('Response Format', () => {
      it('should return correct batch response structure', async () => {
        const images = [{ src: '/test.jpg', width: 800 }];
        mockRequest.json.mockResolvedValue({ images });
        
        const response = await POST({ request: mockRequest });
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data).toHaveProperty('success', true);
        expect(data).toHaveProperty('data');
        expect(data).toHaveProperty('metrics');
        
        expect(data.metrics).toHaveProperty('processingTime');
        expect(data.metrics).toHaveProperty('processedCount');
        expect(data.metrics).toHaveProperty('errorCount');
      });

      it('should calculate processing metrics correctly', async () => {
        const images = [
          { src: '/test1.jpg', width: 800 }, // Success
          { src: '', width: 800 },          // Error
          { src: '/test3.jpg', width: 800 }, // Success
        ];
        mockRequest.json.mockResolvedValue({ images });
        
        const response = await POST({ request: mockRequest });
        const data = await response.json();
        
        expect(data.metrics.processedCount).toBe(2);
        expect(data.metrics.errorCount).toBe(1);
        expect(data.metrics.processingTime).toBeGreaterThan(0);
      });

      it('should set correct cache headers for batch requests', async () => {
        const images = [{ src: '/test.jpg', width: 800 }];
        mockRequest.json.mockResolvedValue({ images });
        
        const response = await POST({ request: mockRequest });
        
        expect(response.headers.get('Content-Type')).toBe('application/json');
        expect(response.headers.get('Cache-Control')).toBe('public, max-age=1800');
        expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      });
    });

    describe('Error Handling', () => {
      it('should handle JSON parsing errors', async () => {
        mockRequest.json.mockRejectedValue(new Error('Invalid JSON'));
        
        const response = await POST({ request: mockRequest });
        const data = await response.json();
        
        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('INTERNAL_ERROR');
      });

      it('should handle internal server errors in batch processing', async () => {
        const { generateResponsiveSources } = await import('../../utils/image.js');
        generateResponsiveSources.mockImplementationOnce(() => {
          throw new Error('Mock batch error');
        });

        const images = [{ src: '/test.jpg', width: 800, responsive: true }];
        mockRequest.json.mockResolvedValue({ images });
        
        const response = await POST({ request: mockRequest });
        const data = await response.json();
        
        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('INTERNAL_ERROR');
      });
    });
  });

  describe('OPTIONS /api/image-optimize', () => {
    it('should handle CORS preflight request', async () => {
      const response = await OPTIONS();
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Accept');
      expect(response.headers.get('Access-Control-Max-Age')).toBe('86400');
    });

    it('should return empty body for preflight', async () => {
      const response = await OPTIONS();
      
      const text = await response.text();
      expect(text).toBe('');
    });
  });

  describe('Edge Cases and Performance', () => {
    it('should handle extremely large dimension requests', async () => {
      mockUrl = new URL('http://localhost:3000/api/image-optimize?src=/test.jpg&w=3999&h=3999');
      
      const response = await GET({ request: mockRequest, url: mockUrl });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle requests with minimal parameters', async () => {
      mockUrl = new URL('http://localhost:3000/api/image-optimize?src=/test.jpg');
      
      const response = await GET({ request: mockRequest, url: mockUrl });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.fallback.src).toContain('/test.jpg');
    });

    it('should handle special characters in image URLs', async () => {
      const encodedSrc = encodeURIComponent('/images/test image with spaces & symbols.jpg');
      mockUrl = new URL(`http://localhost:3000/api/image-optimize?src=${encodedSrc}&w=800`);
      
      const response = await GET({ request: mockRequest, url: mockUrl });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should process maximum allowed batch size efficiently', async () => {
      const images = Array(10).fill(null).map((_, i) => ({
        src: `/test${i}.jpg`,
        width: 800,
        height: 600,
      }));
      mockRequest.json.mockResolvedValue({ images });
      
      const startTime = Date.now();
      const response = await POST({ request: mockRequest });
      const processingTime = Date.now() - startTime;
      
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(10);
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent requests gracefully', async () => {
      const requests = Array(5).fill(null).map((_, i) => {
        const testUrl = new URL(`http://localhost:3000/api/image-optimize?src=/test${i}.jpg&w=800`);
        return GET({ request: mockRequest, url: testUrl });
      });
      
      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});