/**
 * Performance Configuration and Budgets
 * Comprehensive performance optimization settings for image delivery
 */

export const PERFORMANCE_BUDGETS = {
  // Core Web Vitals targets
  webVitals: {
    // Largest Contentful Paint (LCP) - should be under 2.5s
    lcp: {
      good: 2500,
      needsImprovement: 4000,
      poor: Infinity
    },
    
    // First Input Delay (FID) - should be under 100ms
    fid: {
      good: 100,
      needsImprovement: 300,
      poor: Infinity
    },
    
    // Cumulative Layout Shift (CLS) - should be under 0.1
    cls: {
      good: 0.1,
      needsImprovement: 0.25,
      poor: Infinity
    },
    
    // First Contentful Paint (FCP) - should be under 1.8s
    fcp: {
      good: 1800,
      needsImprovement: 3000,
      poor: Infinity
    },
    
    // Time to Interactive (TTI) - should be under 3.8s
    tti: {
      good: 3800,
      needsImprovement: 7300,
      poor: Infinity
    }
  },

  // Image-specific performance budgets
  images: {
    // Maximum image load time per image
    maxLoadTime: 2000, // 2 seconds
    
    // Maximum total image payload per page
    maxTotalSize: 3 * 1024 * 1024, // 3MB
    
    // Maximum individual image size
    maxIndividualSize: 500 * 1024, // 500KB
    
    // Target cache hit rate
    cacheHitRate: 0.85, // 85%
    
    // Maximum images per page
    maxImagesPerPage: 20,
    
    // Compression targets
    compression: {
      jpeg: 0.7, // 70% compression
      webp: 0.8, // 80% compression
      avif: 0.85 // 85% compression
    }
  },

  // Bundle size budgets
  bundles: {
    // Maximum JavaScript bundle size
    maxJSBundle: 250 * 1024, // 250KB
    
    // Maximum CSS bundle size
    maxCSSBundle: 50 * 1024, // 50KB
    
    // Maximum total bundle size
    maxTotalBundle: 300 * 1024, // 300KB
    
    // Critical resource size
    maxCriticalResource: 14 * 1024 // 14KB (for 1RTT over 3G)
  }
};

export const OPTIMIZATION_CONFIG = {
  // Image optimization settings
  images: {
    // Default quality settings by format
    quality: {
      jpeg: 80,
      webp: 85,
      avif: 70,
      png: 90
    },
    
    // Responsive breakpoints
    breakpoints: [
      { name: 'mobile', width: 480, quality: 75 },
      { name: 'tablet', width: 768, quality: 80 },
      { name: 'desktop', width: 1200, quality: 85 },
      { name: 'large', width: 1920, quality: 80 }
    ],
    
    // Format selection based on browser support
    formats: {
      // Modern browsers
      modern: ['avif', 'webp', 'jpeg'],
      // Legacy browsers
      legacy: ['webp', 'jpeg'],
      // Fallback
      fallback: ['jpeg']
    },
    
    // Lazy loading configuration
    lazyLoading: {
      rootMargin: '50px',
      threshold: 0.1,
      enableNative: true
    },
    
    // Preloading strategy
    preloading: {
      // Number of critical images to preload
      criticalImages: 3,
      // Preload images above the fold
      aboveFold: true,
      // Use link preload for hero images
      useLinkPreload: true
    }
  },

  // Caching strategies
  caching: {
    // Browser cache TTL
    browser: {
      images: 30 * 24 * 60 * 60, // 30 days
      static: 7 * 24 * 60 * 60,  // 7 days
      html: 5 * 60               // 5 minutes
    },
    
    // CDN cache TTL
    cdn: {
      images: 30 * 24 * 60 * 60, // 30 days
      static: 7 * 24 * 60 * 60,  // 7 days
      html: 60 * 60              // 1 hour
    },
    
    // Redis cache TTL
    redis: {
      processed: 24 * 60 * 60,   // 24 hours
      metadata: 7 * 24 * 60 * 60 // 7 days
    },
    
    // Service Worker cache strategy
    serviceWorker: {
      strategy: 'stale-while-revalidate',
      maxAge: 7 * 24 * 60 * 60,  // 7 days
      maxEntries: 100
    }
  },

  // Network optimizations
  network: {
    // HTTP/2 Server Push for critical resources
    http2Push: {
      enabled: true,
      resources: [
        '/assets/critical.css',
        '/assets/hero-image.webp'
      ]
    },
    
    // Resource hints
    resourceHints: {
      preconnect: [
        'https://fonts.googleapis.com',
        'https://cdn.example.com'
      ],
      prefetch: [
        '/assets/secondary-image.webp'
      ]
    },
    
    // Compression settings
    compression: {
      gzip: {
        enabled: true,
        level: 6,
        minSize: 1024
      },
      brotli: {
        enabled: true,
        quality: 6,
        minSize: 1024
      }
    }
  }
};

export const MONITORING_CONFIG = {
  // Performance monitoring intervals
  intervals: {
    realUserMonitoring: 1000,     // 1 second
    syntheticMonitoring: 60000,   // 1 minute
    healthCheck: 30000,           // 30 seconds
    cacheAnalysis: 300000         // 5 minutes
  },

  // Alert thresholds
  alerts: {
    // Web Vitals alerts
    lcp: {
      warning: 3000,    // 3 seconds
      critical: 4000    // 4 seconds
    },
    cls: {
      warning: 0.15,    // 0.15 CLS score
      critical: 0.25    // 0.25 CLS score
    },
    fid: {
      warning: 200,     // 200ms
      critical: 300     // 300ms
    },
    
    // Image performance alerts
    imageLoadTime: {
      warning: 3000,    // 3 seconds
      critical: 5000    // 5 seconds
    },
    cacheHitRate: {
      warning: 0.7,     // 70%
      critical: 0.5     // 50%
    },
    
    // Error rate alerts
    errorRate: {
      warning: 0.05,    // 5%
      critical: 0.1     // 10%
    }
  },

  // Metrics collection
  metrics: {
    // Real User Monitoring (RUM)
    rum: {
      enabled: true,
      sampleRate: 0.1,  // 10% sampling
      endpoint: '/api/metrics/rum'
    },
    
    // Synthetic monitoring
    synthetic: {
      enabled: true,
      locations: ['us-east', 'eu-west', 'ap-southeast'],
      frequency: 300000 // 5 minutes
    },
    
    // Core metrics to track
    track: [
      'lcp',
      'fid', 
      'cls',
      'fcp',
      'tti',
      'image_load_time',
      'cache_hit_rate',
      'bundle_size',
      'error_rate'
    ]
  }
};

export const SCALING_CONFIG = {
  // Auto-scaling triggers
  scaling: {
    // CPU utilization threshold
    cpu: {
      scaleUp: 70,      // Scale up at 70% CPU
      scaleDown: 30     // Scale down at 30% CPU
    },
    
    // Memory utilization threshold
    memory: {
      scaleUp: 80,      // Scale up at 80% memory
      scaleDown: 40     // Scale down at 40% memory
    },
    
    // Request rate threshold
    requestRate: {
      scaleUp: 1000,    // Scale up at 1000 req/min
      scaleDown: 200    // Scale down at 200 req/min
    },
    
    // Response time threshold
    responseTime: {
      scaleUp: 2000,    // Scale up if avg response > 2s
      scaleDown: 500    // Scale down if avg response < 500ms
    }
  },

  // Container limits
  resources: {
    // Production limits
    production: {
      cpu: '2',         // 2 CPU cores
      memory: '4Gi',    // 4GB RAM
      storage: '20Gi'   // 20GB storage
    },
    
    // Development limits
    development: {
      cpu: '1',         // 1 CPU core
      memory: '2Gi',    // 2GB RAM
      storage: '10Gi'   // 10GB storage
    }
  },

  // Load balancing
  loadBalancing: {
    algorithm: 'round_robin',
    healthCheck: {
      path: '/api/health',
      interval: 30,     // 30 seconds
      timeout: 10,      // 10 seconds
      retries: 3
    },
    
    // Session affinity for image processing
    sessionAffinity: {
      enabled: false,   // Disabled for stateless operation
      timeout: 3600     // 1 hour
    }
  }
};

// Export convenience functions
export function getOptimalImageQuality(format, size, connectionSpeed = '4g') {
  const baseQuality = OPTIMIZATION_CONFIG.images.quality[format] || 80;
  
  // Adjust quality based on connection speed
  const connectionMultiplier = {
    'slow-2g': 0.7,
    '2g': 0.8,
    '3g': 0.9,
    '4g': 1.0
  };
  
  // Adjust quality based on image size
  const sizeMultiplier = size > 1920 ? 0.9 : 1.0;
  
  return Math.round(baseQuality * (connectionMultiplier[connectionSpeed] || 1.0) * sizeMultiplier);
}

export function shouldUseFormat(format, userAgent) {
  const supportsAVIF = userAgent.includes('Chrome/') && parseInt(userAgent.match(/Chrome\/(\d+)/)[1]) >= 85;
  const supportsWebP = userAgent.includes('Chrome/') || userAgent.includes('Firefox/') || userAgent.includes('Safari/');
  
  switch (format) {
    case 'avif':
      return supportsAVIF;
    case 'webp':
      return supportsWebP;
    default:
      return true;
  }
}

export function calculateImageBudget(pageType = 'default') {
  const budgets = {
    homepage: PERFORMANCE_BUDGETS.images.maxTotalSize * 1.2, // 20% more for homepage
    product: PERFORMANCE_BUDGETS.images.maxTotalSize,
    blog: PERFORMANCE_BUDGETS.images.maxTotalSize * 0.8,     // 20% less for blog
    default: PERFORMANCE_BUDGETS.images.maxTotalSize
  };
  
  return budgets[pageType] || budgets.default;
}