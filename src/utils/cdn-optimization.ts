/**
 * CDN Optimization Utilities
 * Multi-CDN setup with performance monitoring and failover
 */

export interface CDNConfig {
  primary: string;
  fallback: string[];
  regions: Record<string, string>;
  features: {
    webp: boolean;
    avif: boolean;
    resize: boolean;
    quality: boolean;
  };
}

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  dpr?: number;
}

export class CDNOptimizer {
  private static instance: CDNOptimizer;
  private config: CDNConfig;
  private performanceMetrics: Map<string, number> = new Map();
  private failedCDNs: Set<string> = new Set();

  constructor(config: CDNConfig) {
    this.config = config;
  }

  static getInstance(config?: CDNConfig): CDNOptimizer {
    if (!CDNOptimizer.instance && config) {
      CDNOptimizer.instance = new CDNOptimizer(config);
    }
    return CDNOptimizer.instance;
  }

  /**
   * Generate optimized CDN URL with automatic format selection
   */
  generateCDNUrl(
    imagePath: string,
    options: ImageTransformOptions = {},
    cdnOverride?: string
  ): string {
    const cdn = cdnOverride || this.selectOptimalCDN();
    const transformedPath = this.buildTransformPath(imagePath, options);
    
    return `${cdn}${transformedPath}`;
  }

  /**
   * Generate multiple CDN URLs for different formats (for picture element)
   */
  generateResponsiveCDNUrls(
    imagePath: string,
    breakpoints: Array<{ width: number; quality?: number }>,
    formats: string[] = ['avif', 'webp', 'jpeg']
  ): Array<{ format: string; urls: Array<{ width: number; url: string }> }> {
    const cdn = this.selectOptimalCDN();
    
    return formats.map(format => ({
      format,
      urls: breakpoints.map(({ width, quality = 80 }) => ({
        width,
        url: this.generateCDNUrl(imagePath, { width, quality, format: format as any }, cdn)
      }))
    }));
  }

  /**
   * Select optimal CDN based on performance and availability
   */
  private selectOptimalCDN(): string {
    // Check primary CDN first
    if (!this.failedCDNs.has(this.config.primary)) {
      return this.config.primary;
    }

    // Find best performing fallback
    let bestCDN = this.config.fallback[0];
    let bestTime = Infinity;

    for (const cdn of this.config.fallback) {
      if (this.failedCDNs.has(cdn)) continue;
      
      const avgTime = this.performanceMetrics.get(cdn) || Infinity;
      if (avgTime < bestTime) {
        bestTime = avgTime;
        bestCDN = cdn;
      }
    }

    return bestCDN || this.config.primary;
  }

  /**
   * Build transformation path based on CDN provider
   */
  private buildTransformPath(imagePath: string, options: ImageTransformOptions): string {
    const params = new URLSearchParams();
    
    // Add transformations
    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.quality) params.set('q', options.quality.toString());
    if (options.format && options.format !== 'auto') params.set('f', options.format);
    if (options.fit) params.set('fit', options.fit);
    if (options.dpr) params.set('dpr', options.dpr.toString());

    // Auto-format detection
    if (options.format === 'auto') {
      if (this.config.features.avif && this.supportsAVIF()) {
        params.set('f', 'avif');
      } else if (this.config.features.webp && this.supportsWebP()) {
        params.set('f', 'webp');
      }
    }

    const queryString = params.toString();
    return queryString ? `${imagePath}?${queryString}` : imagePath;
  }

  /**
   * Monitor CDN performance
   */
  async measureCDNPerformance(testImageUrl: string): Promise<void> {
    const cdns = [this.config.primary, ...this.config.fallback];
    
    const measurements = await Promise.allSettled(
      cdns.map(async (cdn) => {
        const startTime = performance.now();
        try {
          const response = await fetch(`${cdn}${testImageUrl}`, {
            method: 'HEAD',
            cache: 'no-cache'
          });
          
          const endTime = performance.now();
          const responseTime = endTime - startTime;
          
          if (response.ok) {
            this.performanceMetrics.set(cdn, responseTime);
            this.failedCDNs.delete(cdn);
            return { cdn, responseTime, success: true };
          } else {
            this.failedCDNs.add(cdn);
            return { cdn, responseTime: Infinity, success: false };
          }
        } catch (error) {
          this.failedCDNs.add(cdn);
          return { cdn, responseTime: Infinity, success: false };
        }
      })
    );

    console.log('CDN Performance Results:', measurements);
  }

  /**
   * Preconnect to CDN domains for faster loading
   */
  preconnectCDNs(): void {
    if (typeof document === 'undefined') return;

    const cdns = [this.config.primary, ...this.config.fallback];
    
    cdns.forEach(cdn => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = new URL(cdn).origin;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }

  /**
   * Generate critical resource hints
   */
  generateResourceHints(criticalImages: string[]): string[] {
    const cdn = this.selectOptimalCDN();
    const hints: string[] = [];

    // DNS prefetch
    hints.push(`<link rel="dns-prefetch" href="${new URL(cdn).origin}">`);
    
    // Preconnect
    hints.push(`<link rel="preconnect" href="${new URL(cdn).origin}" crossorigin>`);
    
    // Preload critical images
    criticalImages.forEach(imagePath => {
      const url = this.generateCDNUrl(imagePath, { 
        width: 400, 
        quality: 85, 
        format: 'auto' 
      });
      hints.push(`<link rel="preload" as="image" href="${url}">`);
    });

    return hints;
  }

  /**
   * Browser capability detection
   */
  private supportsWebP(): boolean {
    if (typeof window === 'undefined') return false;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  private supportsAVIF(): boolean {
    if (typeof window === 'undefined') return false;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    averageResponseTime: number;
    activeCDNs: number;
    failedCDNs: string[];
    bestPerformingCDN: string | null;
  } {
    const activeCDNs = Array.from(this.performanceMetrics.keys())
      .filter(cdn => !this.failedCDNs.has(cdn));
    
    const responseTimes = activeCDNs.map(cdn => this.performanceMetrics.get(cdn) || 0);
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    let bestPerformingCDN: string | null = null;
    let bestTime = Infinity;
    
    for (const [cdn, time] of this.performanceMetrics.entries()) {
      if (!this.failedCDNs.has(cdn) && time < bestTime) {
        bestTime = time;
        bestPerformingCDN = cdn;
      }
    }

    return {
      averageResponseTime,
      activeCDNs: activeCDNs.length,
      failedCDNs: Array.from(this.failedCDNs),
      bestPerformingCDN
    };
  }
}

// Default CDN configurations for popular providers
export const CDN_CONFIGS = {
  digitalOcean: {
    primary: 'https://your-space.nyc3.digitaloceanspaces.com',
    fallback: ['https://your-space.fra1.digitaloceanspaces.com'],
    regions: {
      'us-east': 'https://your-space.nyc3.digitaloceanspaces.com',
      'eu-west': 'https://your-space.fra1.digitaloceanspaces.com',
    },
    features: {
      webp: true,
      avif: false,
      resize: true,
      quality: true,
    }
  },
  
  cloudflare: {
    primary: 'https://imagedelivery.net/your-account-id',
    fallback: [],
    regions: {},
    features: {
      webp: true,
      avif: true,
      resize: true,
      quality: true,
    }
  }
};

// Initialize CDN optimizer
let cdnOptimizer: CDNOptimizer | null = null;

export function initializeCDN(config: CDNConfig): CDNOptimizer {
  cdnOptimizer = CDNOptimizer.getInstance(config);
  
  // Preconnect to CDNs
  if (typeof window !== 'undefined') {
    cdnOptimizer.preconnectCDNs();
    
    // Start performance monitoring
    cdnOptimizer.measureCDNPerformance('/test-image.jpg');
    
    // Set up periodic monitoring
    setInterval(() => {
      cdnOptimizer?.measureCDNPerformance('/test-image.jpg');
    }, 300000); // Every 5 minutes
  }
  
  return cdnOptimizer;
}

export function getCDNOptimizer(): CDNOptimizer | null {
  return cdnOptimizer;
}