// CDN-Compatible Security Configuration
// This configuration ensures security headers work properly with CDN edge locations

export const CDN_SECURITY_CONFIG = {
  // CDN provider specific configurations
  providers: {
    cloudflare: {
      trustedHeaders: [
        'cf-ray',
        'cf-connecting-ip', 
        'cf-ipcountry',
        'cf-cache-status',
        'cf-request-id'
      ],
      securityFeatures: {
        waf: true,
        ddosProtection: true,
        botManagement: true,
        rateLimit: true
      }
    },
    digitalocean: {
      trustedHeaders: [
        'x-digitalocean-cache-status',
        'x-forwarded-for',
        'x-real-ip',
        'x-request-id'
      ],
      securityFeatures: {
        waf: false, // Not available in DO Spaces CDN
        ddosProtection: true,
        botManagement: false,
        rateLimit: true
      }
    },
    cloudfront: {
      trustedHeaders: [
        'x-amz-cf-id',
        'cloudfront-forwarded-proto',
        'cloudfront-is-mobile-viewer',
        'cloudfront-viewer-country'
      ],
      securityFeatures: {
        waf: true,
        ddosProtection: true,
        botManagement: false,
        rateLimit: true
      }
    }
  },

  // Security headers optimized for CDN distribution
  headers: {
    // Core security headers that work well with CDNs
    coreHeaders: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Permitted-Cross-Domain-Policies': 'none'
    },

    // Headers that may need CDN-specific adjustments
    cdnAwareHeaders: {
      // HSTS - only set on origin, CDN will propagate
      'Strict-Transport-Security': {
        value: 'max-age=31536000; includeSubDomains; preload',
        cdnHandling: 'origin-only', // Let CDN handle HTTPS redirects
        environments: ['production']
      },

      // CSP - adjusted for CDN domains
      'Content-Security-Policy': {
        value: generateCSP(),
        cdnHandling: 'modify', // CDN may need to modify for optimization
        environments: ['production', 'staging']
      },

      // CORS headers for cross-origin requests through CDN
      'Cross-Origin-Resource-Policy': {
        value: 'cross-origin', // Allow CDN distribution
        cdnHandling: 'preserve'
      },

      'Cross-Origin-Opener-Policy': {
        value: 'same-origin-allow-popups',
        cdnHandling: 'preserve'
      },

      'Cross-Origin-Embedder-Policy': {
        value: 'unsafe-none', // Relaxed for CDN compatibility
        cdnHandling: 'preserve'
      }
    },

    // Asset-specific headers
    assetHeaders: {
      fonts: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Range',
        'Cross-Origin-Resource-Policy': 'cross-origin'
      },
      images: {
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Access-Control-Allow-Origin': '*'
      },
      scripts: {
        'X-Content-Type-Options': 'nosniff',
        'Cross-Origin-Resource-Policy': 'same-origin'
      },
      styles: {
        'X-Content-Type-Options': 'nosniff',
        'Cross-Origin-Resource-Policy': 'cross-origin'
      }
    }
  },

  // Permissions Policy optimized for performance
  permissionsPolicy: {
    // Disable features that can impact performance
    performance: [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'usb=()',
      'bluetooth=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
      'ambient-light-sensor=()',
      'payment=()'
    ],
    // Allow performance monitoring
    monitoring: [
      'cross-origin-isolated=(self)',
      'web-share=(self)'
    ]
  },

  // Rate limiting that works with CDN
  rateLimiting: {
    // CDN edge rate limiting (if supported)
    edge: {
      enabled: true,
      rules: {
        api: { requests: 30, window: '1m', burst: 10 },
        static: { requests: 1000, window: '1m', burst: 100 },
        pages: { requests: 100, window: '1m', burst: 20 }
      }
    },
    // Origin rate limiting (fallback)
    origin: {
      enabled: true,
      rules: {
        api: { requests: 50, window: '1m', burst: 15 },
        global: { requests: 200, window: '1m', burst: 50 }
      }
    }
  }
};

// Generate Content Security Policy with CDN domains
function generateCSP() {
  const cdnDomains = [
    'https://cdn.jsdelivr.net',
    'https://cdnjs.cloudflare.com',
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    '*.digitaloceanspaces.com'
  ];

  const csp = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for some Astro features
      "'unsafe-eval'", // Required for development
      'https://va.vercel-scripts.com',
      ...cdnDomains.filter(domain => !domain.includes('fonts'))
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for CSS-in-JS
      'https://fonts.googleapis.com',
      ...cdnDomains
    ],
    'img-src': [
      "'self'",
      'data:',
      'https:',
      'blob:'
    ],
    'font-src': [
      "'self'",
      'data:',
      'https://fonts.gstatic.com',
      ...cdnDomains
    ],
    'connect-src': [
      "'self'",
      'https://va.vercel-scripts.com',
      'https://vitals.vercel-insights.com'
    ],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'upgrade-insecure-requests': []
  };

  return Object.entries(csp)
    .map(([directive, values]) => 
      values.length > 0 ? `${directive} ${values.join(' ')}` : directive
    )
    .join('; ');
}

// Environment-specific configurations
export const ENVIRONMENT_CONFIGS = {
  development: {
    enableDebugHeaders: true,
    relaxedCSP: true,
    skipHTTPS: true,
    additionalHeaders: {
      'X-Debug-Mode': 'development',
      'X-Asset-Type': 'debug-enabled'
    }
  },
  staging: {
    enableDebugHeaders: true,
    relaxedCSP: false,
    skipHTTPS: false,
    additionalHeaders: {
      'X-Environment': 'staging'
    }
  },
  production: {
    enableDebugHeaders: false,
    relaxedCSP: false,
    skipHTTPS: false,
    additionalHeaders: {}
  }
};

// CDN Health Check Configuration
export const CDN_HEALTH_CONFIG = {
  endpoints: {
    health: '/api/health',
    metrics: '/api/metrics',
    status: '/api/status'
  },
  
  // Headers for health check responses
  healthHeaders: {
    'Cache-Control': 'public, max-age=60',
    'X-Health-Check': 'ok',
    'Access-Control-Allow-Origin': '*'
  },
  
  // Performance monitoring endpoints
  monitoring: {
    enabled: true,
    endpoints: [
      '/api/performance',
      '/api/cache-status'
    ],
    headers: {
      'Cache-Control': 'no-cache',
      'X-Monitoring': 'enabled'
    }
  }
};

// CDN Purge Configuration
export const CDN_PURGE_CONFIG = {
  // Automatic purge triggers
  triggers: {
    deployment: true,
    contentUpdate: true,
    emergencyPurge: true
  },
  
  // Purge by file patterns
  patterns: {
    all: '/*',
    static: [
      '*.css',
      '*.js',
      '*.png',
      '*.jpg',
      '*.jpeg',
      '*.gif',
      '*.webp',
      '*.avif',
      '*.svg',
      '*.ico',
      '*.woff',
      '*.woff2'
    ],
    pages: [
      '/',
      '/*.html',
      '/software-engineer',
      '/customer-service'
    ],
    api: [
      '/api/*'
    ]
  },
  
  // Purge by tags (if supported by CDN)
  tags: {
    static: 'static-assets',
    pages: 'html-pages',
    api: 'api-responses',
    images: 'image-assets',
    styles: 'css-assets',
    scripts: 'js-assets'
  }
};