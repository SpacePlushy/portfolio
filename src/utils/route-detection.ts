/**
 * Route Detection Utility
 * 
 * Provides pattern-based detection for static vs dynamic routes
 * to optimize middleware behavior and caching strategies
 */

interface RoutePattern {
  pattern: string | RegExp;
  type: 'static' | 'dynamic' | 'api' | 'health' | 'asset';
  cacheable: boolean;
  skipMiddleware?: boolean;
  description: string;
}

// Route patterns ordered by priority (most specific first)
const ROUTE_PATTERNS: RoutePattern[] = [
  // Health and monitoring endpoints
  {
    pattern: /^\/api\/(health|readiness)$/,
    type: 'health',
    cacheable: false,
    skipMiddleware: true,
    description: 'Health check endpoints'
  },
  
  // Static assets with file extensions
  {
    pattern: /\.(css|js|mjs|jsx|tsx|json|xml|txt|ico|png|jpg|jpeg|gif|webp|avif|svg|woff|woff2|ttf|eot|otf)$/i,
    type: 'asset',
    cacheable: true,
    skipMiddleware: true,
    description: 'Static asset files'
  },
  
  // Favicon and manifest files
  {
    pattern: /^\/(favicon(-\d+x\d+)?\.(?:ico|png)|apple-touch-icon\.png|manifest\.json|robots\.txt|sitemap\.xml)$/,
    type: 'asset',
    cacheable: true,
    skipMiddleware: true,
    description: 'Standard web assets'
  },
  
  // Well-known paths
  {
    pattern: /^\/\.well-known\//,
    type: 'static',
    cacheable: true,
    skipMiddleware: true,
    description: 'Well-known URIs'
  },
  
  // API endpoints
  {
    pattern: /^\/api\//,
    type: 'api',
    cacheable: false,
    skipMiddleware: false,
    description: 'API endpoints'
  },
  
  // Monitoring dashboard
  {
    pattern: /^\/monitoring\//,
    type: 'dynamic',
    cacheable: false,
    skipMiddleware: false,
    description: 'Monitoring dashboard'
  },
  
  // Health status page
  {
    pattern: /^\/health-status$/,
    type: 'dynamic',
    cacheable: false,
    skipMiddleware: false,
    description: 'Health status dashboard'
  },
  
  // Portfolio pages (dynamic content)
  {
    pattern: /^\/(software-engineer|customer-service)$/,
    type: 'dynamic',
    cacheable: true,
    skipMiddleware: false,
    description: 'Portfolio pages'
  },
  
  // Home page
  {
    pattern: /^\/$/,
    type: 'dynamic',
    cacheable: true,
    skipMiddleware: false,
    description: 'Home page'
  },
  
  // Static pages (fallback for other routes)
  {
    pattern: /^\/[^\/]*$/,
    type: 'static',
    cacheable: true,
    skipMiddleware: false,
    description: 'Static pages'
  }
];

// Asset type detection patterns
const ASSET_TYPE_PATTERNS = {
  images: /\.(png|jpg|jpeg|gif|webp|avif|svg|ico)$/i,
  fonts: /\.(woff|woff2|ttf|eot|otf)$/i,
  scripts: /\.(js|mjs|jsx|tsx)$/i,
  styles: /\.css$/i,
  documents: /\.(json|xml|txt|pdf)$/i,
  media: /\.(mp4|webm|ogg|mp3|wav|flac)$/i
};

// Cache duration patterns
const CACHE_DURATIONS = {
  'long': 31536000, // 1 year for immutable assets
  'medium': 86400, // 1 day for semi-static content
  'short': 300, // 5 minutes for dynamic content
  'none': 0 // No cache
};

export interface RouteInfo {
  type: 'static' | 'dynamic' | 'api' | 'health' | 'asset';
  cacheable: boolean;
  skipMiddleware: boolean;
  assetType?: string;
  cacheControl?: string;
  description: string;
  pattern?: string | RegExp;
}

/**
 * Detect route type and characteristics based on pathname
 */
export function detectRouteType(pathname: string): RouteInfo {
  // Normalize pathname
  const normalizedPath = pathname.toLowerCase().trim();
  
  // Check each pattern in order
  for (const routePattern of ROUTE_PATTERNS) {
    let matches = false;
    
    if (typeof routePattern.pattern === 'string') {
      matches = normalizedPath === routePattern.pattern;
    } else {
      matches = routePattern.pattern.test(normalizedPath);
    }
    
    if (matches) {
      return {
        type: routePattern.type,
        cacheable: routePattern.cacheable,
        skipMiddleware: routePattern.skipMiddleware || false,
        assetType: detectAssetType(pathname),
        cacheControl: getCacheControlForRoute(routePattern),
        description: routePattern.description,
        pattern: routePattern.pattern
      };
    }
  }
  
  // Default fallback
  return {
    type: 'dynamic',
    cacheable: false,
    skipMiddleware: false,
    assetType: undefined,
    cacheControl: getCacheControl('none'),
    description: 'Unknown route type',
    pattern: undefined
  };
}

/**
 * Detect asset type from file extension
 */
export function detectAssetType(pathname: string): string | undefined {
  for (const [type, pattern] of Object.entries(ASSET_TYPE_PATTERNS)) {
    if (pattern.test(pathname)) {
      return type;
    }
  }
  return undefined;
}

/**
 * Generate appropriate cache control header
 */
function getCacheControlForRoute(routePattern: RoutePattern): string {
  if (!routePattern.cacheable) {
    return getCacheControl('none');
  }
  
  switch (routePattern.type) {
    case 'asset':
      return getCacheControl('long');
    case 'static':
      return getCacheControl('medium');
    case 'dynamic':
      return getCacheControl('short');
    case 'api':
    case 'health':
    default:
      return getCacheControl('none');
  }
}

/**
 * Get cache control string for duration type
 */
function getCacheControl(durationType: keyof typeof CACHE_DURATIONS): string {
  const duration = CACHE_DURATIONS[durationType];
  
  if (duration === 0) {
    return 'no-cache, no-store, must-revalidate, private';
  }
  
  if (duration >= CACHE_DURATIONS.long) {
    return `public, max-age=${duration}, s-maxage=${duration}, immutable`;
  }
  
  if (duration >= CACHE_DURATIONS.medium) {
    return `public, max-age=${duration}, s-maxage=${duration * 30}, stale-while-revalidate=${duration}`;
  }
  
  return `public, max-age=${duration}, s-maxage=${duration * 12}, stale-while-revalidate=${duration * 2}`;
}

/**
 * Check if a route should skip middleware processing entirely
 */
export function shouldSkipMiddleware(pathname: string): boolean {
  const routeInfo = detectRouteType(pathname);
  return routeInfo.skipMiddleware;
}

/**
 * Check if a route is a static asset
 */
export function isStaticAsset(pathname: string): boolean {
  const routeInfo = detectRouteType(pathname);
  return routeInfo.type === 'asset';
}

/**
 * Check if a route is an API endpoint
 */
export function isApiRoute(pathname: string): boolean {
  const routeInfo = detectRouteType(pathname);
  return routeInfo.type === 'api' || routeInfo.type === 'health';
}

/**
 * Check if a route is cacheable
 */
export function isCacheable(pathname: string): boolean {
  const routeInfo = detectRouteType(pathname);
  return routeInfo.cacheable;
}

/**
 * Get optimized cache headers for a route
 */
export function getCacheHeaders(pathname: string): Record<string, string> {
  const routeInfo = detectRouteType(pathname);
  const headers: Record<string, string> = {
    'Cache-Control': routeInfo.cacheControl || getCacheControl('none')
  };
  
  if (routeInfo.cacheable) {
    // Add Vary header for better caching
    const varyHeaders = ['Accept-Encoding'];
    
    if (routeInfo.type === 'dynamic') {
      varyHeaders.push('Accept', 'Accept-Language');
    }
    
    headers['Vary'] = varyHeaders.join(', ');
    
    // Add ETag for better cache validation (except for health endpoints)
    if (routeInfo.type !== 'health') {
      const lastModified = new Date().toUTCString();
      const etag = `"${Buffer.from(pathname + lastModified).toString('base64').slice(0, 16)}"`;
      headers['ETag'] = etag;
    }
  }
  
  return headers;
}

/**
 * Get route statistics for monitoring
 */
export function getRouteStats(): {
  patterns: number;
  assetTypes: number;
  cacheTypes: number;
} {
  return {
    patterns: ROUTE_PATTERNS.length,
    assetTypes: Object.keys(ASSET_TYPE_PATTERNS).length,
    cacheTypes: Object.keys(CACHE_DURATIONS).length
  };
}

/**
 * Validate and test route patterns
 */
export function testRoutePattern(pathname: string): {
  detected: RouteInfo;
  matched: boolean;
  performance: number;
} {
  const startTime = performance.now();
  const detected = detectRouteType(pathname);
  const endTime = performance.now();
  
  return {
    detected,
    matched: detected.pattern !== undefined,
    performance: endTime - startTime
  };
}