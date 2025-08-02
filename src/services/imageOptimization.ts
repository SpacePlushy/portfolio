/**
 * Image Optimization Service
 * 
 * Client-side service for integrating with image optimization API
 * Provides caching, error handling, and performance monitoring
 */

import type {
  ImageOptimizationParams,
  OptimizedImageData,
  ImageOptimizationResponse,
  ImageServiceConfig,
  ImageCacheEntry,
  ResponsiveSource,
  ImagePerformanceMetrics,
} from '../types/image';

/**
 * Default service configuration
 */
const DEFAULT_CONFIG: ImageServiceConfig = {
  baseUrl: '/api/image-optimize',
  defaultQuality: 80,
  defaultFormat: 'jpeg',
  cacheTTL: 3600000, // 1 hour in milliseconds
  maxCacheSize: 100,
  enableWebP: true,
  enableAVIF: true,
};

/**
 * In-memory cache for optimized image data
 */
class ImageCache {
  private cache = new Map<string, ImageCacheEntry>();
  private readonly maxSize: number;
  private readonly ttl: number;

  constructor(maxSize: number = 100, ttl: number = 3600000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  /**
   * Generate cache key from optimization parameters
   */
  private generateKey(src: string, params: ImageOptimizationParams): string {
    const paramString = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    return `${src}|${paramString}`;
  }

  /**
   * Get cached image data
   */
  get(src: string, params: ImageOptimizationParams): OptimizedImageData | null {
    const key = this.generateKey(src, params);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update hit count
    entry.hits++;
    return entry.optimizedData;
  }

  /**
   * Set cached image data
   */
  set(src: string, params: ImageOptimizationParams, data: OptimizedImageData): void {
    const key = this.generateKey(src, params);

    // Clean cache if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      src,
      optimizedData: data,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    let leastHits = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // Prioritize by least hits, then by oldest timestamp
      if (entry.hits < leastHits || (entry.hits === leastHits && entry.timestamp < oldestTime)) {
        oldestKey = key;
        oldestTime = entry.timestamp;
        leastHits = entry.hits;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clear expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalHits: Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.hits, 0),
    };
  }
}

/**
 * Image Optimization Service Class
 */
class ImageOptimizationService {
  private config: ImageServiceConfig;
  private cache: ImageCache;
  private performanceMetrics: ImagePerformanceMetrics[] = [];

  constructor(config: Partial<ImageServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new ImageCache(this.config.maxCacheSize, this.config.cacheTTL);

    // Setup periodic cache cleanup
    if (typeof window !== 'undefined') {
      setInterval(() => this.cache.cleanup(), 300000); // Every 5 minutes
    }
  }

  /**
   * Optimize a single image
   */
  async optimizeImage(
    src: string,
    params: ImageOptimizationParams = {}
  ): Promise<OptimizedImageData> {
    // Check cache first
    const cached = this.cache.get(src, params);
    if (cached) {
      return cached;
    }

    const startTime = performance.now();

    try {
      // Build API URL with parameters
      const apiUrl = new URL(this.config.baseUrl, window.location.origin);
      apiUrl.searchParams.set('src', src);

      if (params.width) apiUrl.searchParams.set('w', params.width.toString());
      if (params.height) apiUrl.searchParams.set('h', params.height.toString());
      if (params.quality) apiUrl.searchParams.set('q', params.quality.toString());
      if (params.format) apiUrl.searchParams.set('f', params.format);
      if (params.fit) apiUrl.searchParams.set('fit', params.fit);
      if (params.blur) apiUrl.searchParams.set('blur', params.blur.toString());
      if (params.brightness) apiUrl.searchParams.set('brightness', params.brightness.toString());
      if (params.contrast) apiUrl.searchParams.set('contrast', params.contrast.toString());
      if (params.saturation) apiUrl.searchParams.set('saturation', params.saturation.toString());

      apiUrl.searchParams.set('responsive', 'true');
      apiUrl.searchParams.set('placeholder', 'true');

      // Make API request
      const response = await fetch(apiUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json, image/avif, image/webp, image/*',
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result: ImageOptimizationResponse = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Optimization failed');
      }

      // Record performance metrics
      const loadTime = performance.now() - startTime;
      this.recordMetrics({
        loadTime,
        fileSize: 0, // Would need Content-Length header
        format: params.format || this.config.defaultFormat,
        fromCache: false,
        renderTime: performance.now(),
      });

      // Cache the result
      this.cache.set(src, params, result.data);

      return result.data;

    } catch (error) {
      console.error('Image optimization failed:', error);
      
      // Return fallback data
      return {
        sources: [],
        fallback: {
          src,
          width: params.width || 0,
          height: params.height || 0,
        },
        dimensions: {
          width: params.width || 0,
          height: params.height || 0,
          aspectRatio: params.width && params.height ? params.width / params.height : undefined,
        },
      };
    }
  }

  /**
   * Optimize multiple images in batch
   */
  async optimizeImagesBatch(
    requests: Array<{ src: string; params: ImageOptimizationParams }>
  ): Promise<OptimizedImageData[]> {
    if (requests.length === 0) return [];
    if (requests.length > 10) {
      throw new Error('Maximum 10 images per batch request');
    }

    const startTime = performance.now();

    try {
      // Check cache for each request
      const results: (OptimizedImageData | null)[] = requests.map(({ src, params }) =>
        this.cache.get(src, params)
      );

      // Find uncached requests
      const uncachedIndices: number[] = [];
      const uncachedRequests: any[] = [];

      results.forEach((result, index) => {
        if (!result) {
          uncachedIndices.push(index);
          uncachedRequests.push({
            src: requests[index].src,
            ...requests[index].params,
            responsive: true,
            placeholder: true,
          });
        }
      });

      // Make batch API request for uncached images
      if (uncachedRequests.length > 0) {
        const response = await fetch(this.config.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, image/avif, image/webp, image/*',
          },
          body: JSON.stringify({ images: uncachedRequests }),
        });

        if (!response.ok) {
          throw new Error(`Batch API request failed: ${response.status} ${response.statusText}`);
        }

        const batchResult = await response.json();

        if (!batchResult.success) {
          throw new Error(batchResult.error?.message || 'Batch optimization failed');
        }

        // Update results with API responses
        batchResult.data.forEach((apiResult: any, apiIndex: number) => {
          const originalIndex = uncachedIndices[apiIndex];
          const request = requests[originalIndex];

          if (apiResult.success && apiResult.data) {
            results[originalIndex] = apiResult.data;
            this.cache.set(request.src, request.params, apiResult.data);
          } else {
            // Fallback for failed individual requests
            results[originalIndex] = {
              sources: [],
              fallback: {
                src: request.src,
                width: request.params.width || 0,
                height: request.params.height || 0,
              },
              dimensions: {
                width: request.params.width || 0,
                height: request.params.height || 0,
                aspectRatio: request.params.width && request.params.height 
                  ? request.params.width / request.params.height 
                  : undefined,
              },
            };
          }
        });
      }

      // Record batch performance metrics
      const loadTime = performance.now() - startTime;
      this.recordMetrics({
        loadTime,
        fileSize: 0,
        format: this.config.defaultFormat,
        fromCache: uncachedRequests.length === 0,
        renderTime: performance.now(),
      });

      return results as OptimizedImageData[];

    } catch (error) {
      console.error('Batch image optimization failed:', error);
      
      // Return fallback data for all requests
      return requests.map(({ src, params }) => ({
        sources: [],
        fallback: {
          src,
          width: params.width || 0,
          height: params.height || 0,
        },
        dimensions: {
          width: params.width || 0,
          height: params.height || 0,
          aspectRatio: params.width && params.height ? params.width / params.height : undefined,
        },
      }));
    }
  }

  /**
   * Generate responsive image sources
   */
  generateResponsiveSources(
    src: string,
    breakpoints: ResponsiveSource[],
    baseParams: ImageOptimizationParams = {}
  ): Promise<OptimizedImageData[]> {
    const requests = breakpoints.map(breakpoint => ({
      src,
      params: {
        ...baseParams,
        width: breakpoint.width,
        height: breakpoint.height,
        quality: breakpoint.quality || baseParams.quality,
        format: breakpoint.format || baseParams.format,
      },
    }));

    return this.optimizeImagesBatch(requests);
  }

  /**
   * Record performance metrics
   */
  private recordMetrics(metrics: ImagePerformanceMetrics): void {
    this.performanceMetrics.push(metrics);

    // Keep only last 100 metrics to prevent memory leaks
    if (this.performanceMetrics.length > 100) {
      this.performanceMetrics.shift();
    }

    // Dispatch performance event for monitoring
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('image-performance-metric', {
        detail: metrics
      }));
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    if (this.performanceMetrics.length === 0) {
      return null;
    }

    const metrics = this.performanceMetrics;
    const avgLoadTime = metrics.reduce((sum, m) => sum + m.loadTime, 0) / metrics.length;
    const cacheHitRate = metrics.filter(m => m.fromCache).length / metrics.length;

    return {
      averageLoadTime: avgLoadTime,
      cacheHitRate,
      totalRequests: metrics.length,
      cacheStats: this.cache.getStats(),
    };
  }

  /**
   * Update service configuration
   */
  updateConfig(newConfig: Partial<ImageServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache = new ImageCache(this.config.maxCacheSize, this.config.cacheTTL);
  }
}

// Create and export default service instance
export const imageOptimizationService = new ImageOptimizationService();

// Export service class for custom instances
export { ImageOptimizationService };

// Export utility functions
export * from '../utils/image';