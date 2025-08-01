// Performance and CDN Configuration
const CDN_CONFIG = {
  // CDN detection and optimization
  cdnOptimization: {
    enabled: true,
    // Common CDN headers to detect origin
    cdnHeaders: [
      'cf-ray', // Cloudflare
      'x-amz-cf-id', // AWS CloudFront
      'x-cache', // Generic CDN cache status
      'x-served-by', // Fastly
      'x-digitalocean-cache-status' // Digital Ocean Spaces CDN
    ],
    // Asset types that benefit from aggressive caching
    staticAssets: ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot'],
    // Asset types that should be compressed
    compressibleTypes: ['text/', 'application/javascript', 'application/json', 'application/xml', 'image/svg+xml']
  },
  
  // Cache control configuration optimized for CDN
  cacheControl: {
    // HTML pages - short cache with revalidation for dynamic content
    pages: 'public, max-age=300, s-maxage=86400, stale-while-revalidate=3600',
    // Static assets - long cache with immutable flag
    staticAssets: 'public, max-age=31536000, s-maxage=31536000, immutable',
    // API responses - no cache by default
    api: 'no-cache, no-store, must-revalidate, private',
    // Images - moderate cache with CDN optimization
    images: 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400',
    // Fonts - very long cache
    fonts: 'public, max-age=31536000, s-maxage=31536000, immutable, crossorigin'
  },
  
  // Compression configuration
  compression: {
    enabled: true,
    minSize: 1024, // Minimum size in bytes to compress
    algorithms: ['br', 'gzip', 'deflate'] // Preferred order
  }
};

// Security Configuration
const SECURITY_CONFIG = {
  // Rate limiting configuration
  rateLimiting: {
    enabled: true,
    windowMs: 60 * 1000, // 1 minute window
    limits: {
      '/api/': { max: 30, windowMs: 60 * 1000 }, // 30 requests per minute for API
      '/api/health': { max: 100, windowMs: 60 * 1000 }, // Higher limit for health checks
      'global': { max: 200, windowMs: 60 * 1000 } // Global limit for all requests
    }
  },
  
  // Bot detection configuration
  botDetection: {
    enabled: true,
    blockSuspiciousBots: false, // Set to true to block, false to just flag
    allowedBots: [
      'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
      'yandexbot', 'facebookexternalhit', 'twitterbot', 'linkedinbot',
      'whatsapp', 'telegrambot', 'applebot', 'seznambot',
      // Monitoring and health check services
      'kube-probe', 'GoogleHC', 'UptimeRobot', 'Pingdom', 'StatusCake',
      'Site24x7', 'NewRelicPinger', 'blackbox-exporter'
    ],
    suspiciousPatterns: [
      /bot|crawler|spider|scraper|wget|curl|python|java|go-http|okhttp/i,
      /headless|phantom|selenium|chrome-headless|puppeteer/i,
      /scanner|probe|test|benchmark|monitoring|uptime/i
    ]
  },
  
  // Security headers configuration
  securityHeaders: {
    enabled: true,
    headers: {
      // Content Security Policy - CDN optimized with analytics support
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://plausible.io https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net; connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://plausible.io https://region1.google-analytics.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;",
      
      // Security headers
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
      
      // HSTS (only in production)
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      
      // Additional security headers - CDN compatible
      'X-Permitted-Cross-Domain-Policies': 'none',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    },
    
    // CDN-specific headers that should not be overridden
    preserveCdnHeaders: [
      'cf-cache-status',
      'x-cache',
      'x-served-by',
      'x-digitalocean-cache-status',
      'x-amz-cf-id',
      'age'
    ]
  },
  
  // Logging configuration
  logging: {
    enabled: true,
    logBlocked: true,
    logSuspicious: true,
    logRateLimit: true
  }
};

// In-memory stores for rate limiting and bot detection
const rateLimitStore = new Map();
const botDetectionCache = new Map();
const suspiciousIPs = new Map();

// Import route detection utility (commented out due to import issues)
// import { shouldSkipMiddleware, isStaticAsset, isApiRoute, isCacheable, getCacheHeaders } from './utils/route-detection.js';

// Utility functions
// CDN and Performance Utility Functions
function detectCDN(request) {
  const cdnInfo = {
    provider: null,
    cacheStatus: null,
    rayId: null,
    pop: null
  };
  
  // Cloudflare detection
  if (request.headers.get('cf-ray')) {
    cdnInfo.provider = 'cloudflare';
    cdnInfo.rayId = request.headers.get('cf-ray');
    cdnInfo.cacheStatus = request.headers.get('cf-cache-status');
    cdnInfo.pop = request.headers.get('cf-ipcountry');
  }
  // AWS CloudFront detection
  else if (request.headers.get('x-amz-cf-id')) {
    cdnInfo.provider = 'cloudfront';
    cdnInfo.rayId = request.headers.get('x-amz-cf-id');
    cdnInfo.cacheStatus = request.headers.get('x-cache');
  }
  // Digital Ocean Spaces CDN detection
  else if (request.headers.get('x-digitalocean-cache-status')) {
    cdnInfo.provider = 'digitalocean';
    cdnInfo.cacheStatus = request.headers.get('x-digitalocean-cache-status');
  }
  // Generic CDN detection
  else if (request.headers.get('x-cache') || request.headers.get('x-served-by')) {
    cdnInfo.provider = 'generic';
    cdnInfo.cacheStatus = request.headers.get('x-cache');
  }
  
  return cdnInfo;
}

function determineAssetType(pathname) {
  const ext = pathname.split('.').pop()?.toLowerCase();
  if (!ext) return 'page';
  
  const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg', 'ico'];
  const fontExts = ['woff', 'woff2', 'ttf', 'eot', 'otf'];
  const scriptExts = ['js', 'mjs'];
  const styleExts = ['css'];
  
  if (imageExts.includes(ext)) return 'image';
  if (fontExts.includes(ext)) return 'font';
  if (scriptExts.includes(ext)) return 'script';
  if (styleExts.includes(ext)) return 'style';
  
  return 'static';
}

function getCacheControlHeader(assetType, pathname) {
  const { cacheControl } = CDN_CONFIG;
  
  // API routes
  if (pathname.startsWith('/api/')) {
    return cacheControl.api;
  }
  
  // Asset-specific cache control
  switch (assetType) {
    case 'image':
      return cacheControl.images;
    case 'font':
      return cacheControl.fonts;
    case 'script':
    case 'style':
    case 'static':
      return cacheControl.staticAssets;
    case 'page':
    default:
      return cacheControl.pages;
  }
}

function shouldCompress(contentType, contentLength = 0) {
  if (!CDN_CONFIG.compression.enabled) return false;
  if (contentLength > 0 && contentLength < CDN_CONFIG.compression.minSize) return false;
  
  return CDN_CONFIG.cdnOptimization.compressibleTypes.some(type => 
    contentType?.toLowerCase().includes(type.toLowerCase())
  );
}

function getPreferredEncoding(acceptEncoding) {
  if (!acceptEncoding) return null;
  
  const encodings = acceptEncoding.toLowerCase();
  for (const algorithm of CDN_CONFIG.compression.algorithms) {
    if (encodings.includes(algorithm)) {
      return algorithm;
    }
  }
  return null;
}

function getClientIP(request) {
  // Check various headers for the real IP
  const headers = [
    'cf-connecting-ip', // Cloudflare
    'x-forwarded-for', // Most proxies
    'x-real-ip', // Nginx
    'x-client-ip', // Apache
    'x-forwarded', // General
    'forwarded-for', // RFC 7239
    'forwarded' // RFC 7239
  ];
  
  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // Take the first IP if there are multiple
      return value.split(',')[0].trim();
    }
  }
  
  return 'unknown';
}

function cleanupExpiredEntries(store, windowMs) {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.firstRequest > windowMs) {
      store.delete(key);
    }
  }
}

function checkRateLimit(ip, path, config) {
  if (!config.rateLimiting.enabled) return { allowed: true, remaining: 200, limit: 200 };
  
  // Find the most specific rate limit rule
  let rateConfig = config.rateLimiting.limits.global;
  
  for (const [pattern, limit] of Object.entries(config.rateLimiting.limits)) {
    if (pattern !== 'global' && path.startsWith(pattern)) {
      rateConfig = limit;
      break;
    }
  }
  
  const key = `${ip}:${path.startsWith('/api/') ? '/api/' : 'global'}`;
  const now = Date.now();
  
  // Clean up expired entries periodically
  if (Math.random() < 0.01) { // 1% chance
    cleanupExpiredEntries(rateLimitStore, rateConfig.windowMs);
  }
  
  let entry = rateLimitStore.get(key);
  
  if (!entry) {
    entry = {
      count: 1,
      firstRequest: now,
      lastRequest: now
    };
    rateLimitStore.set(key, entry);
    return { allowed: true, remaining: rateConfig.max - 1, limit: rateConfig.max };
  }
  
  // Reset if window has expired
  if (now - entry.firstRequest > rateConfig.windowMs) {
    entry.count = 1;
    entry.firstRequest = now;
    entry.lastRequest = now;
    rateLimitStore.set(key, entry);
    return { allowed: true, remaining: rateConfig.max - 1, limit: rateConfig.max };
  }
  
  // Increment count
  entry.count++;
  entry.lastRequest = now;
  rateLimitStore.set(key, entry);
  
  const allowed = entry.count <= rateConfig.max;
  const remaining = Math.max(0, rateConfig.max - entry.count);
  const resetTime = entry.firstRequest + rateConfig.windowMs;
  
  return { allowed, remaining, resetTime, current: entry.count, limit: rateConfig.max };
}

function detectBot(request, ip, config) {
  if (!config.botDetection.enabled) {
    return { isBot: false, confidence: 0, signals: [] };
  }
  
  const userAgent = request.headers.get('user-agent') || '';
  const accept = request.headers.get('accept') || '';
  const acceptLanguage = request.headers.get('accept-language') || '';
  const acceptEncoding = request.headers.get('accept-encoding') || '';
  // const referer = request.headers.get('referer') || '';
  
  // Check cache first
  const cacheKey = `${ip}:${userAgent}`;
  const cached = botDetectionCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minute cache
    return cached.result;
  }
  
  let confidence = 0;
  const signals = [];
  
  // User-Agent Analysis
  if (!userAgent) {
    confidence += 40;
    signals.push('missing_user_agent');
  } else {
    // Check for allowed bots first
    const isAllowedBot = config.botDetection.allowedBots.some(bot => 
      userAgent.toLowerCase().includes(bot.toLowerCase())
    );
    
    if (isAllowedBot) {
      const result = { isBot: true, confidence: 95, signals: ['allowed_search_engine'], type: 'allowed' };
      botDetectionCache.set(cacheKey, { result, timestamp: Date.now() });
      return result;
    }
    
    // Check suspicious patterns
    for (const pattern of config.botDetection.suspiciousPatterns) {
      if (pattern.test(userAgent)) {
        confidence += 30;
        signals.push('suspicious_user_agent');
        break;
      }
    }
    
    // Check for missing browser characteristics
    if (!/Mozilla|WebKit|Gecko/.test(userAgent)) {
      confidence += 25;
      signals.push('non_browser_user_agent');
    }
  }
  
  // Header Analysis
  if (!accept || accept === '*/*') {
    confidence += 20;
    signals.push('suspicious_accept_header');
  }
  
  if (!acceptLanguage) {
    confidence += 15;
    signals.push('missing_accept_language');
  }
  
  if (!acceptEncoding) {
    confidence += 15;
    signals.push('missing_accept_encoding');
  }
  
  // Check for common bot header patterns
  const botHeaders = ['x-forwarded-for', 'x-real-ip', 'cf-ray'];
  let hasProxyHeaders = 0;
  botHeaders.forEach(header => {
    if (request.headers.get(header)) hasProxyHeaders++;
  });
  
  if (hasProxyHeaders >= 2) {
    confidence += 10;
    signals.push('multiple_proxy_headers');
  }
  
  // Behavioral signals (would need to be tracked over time)
  const suspiciousIP = suspiciousIPs.get(ip);
  if (suspiciousIP) {
    if (suspiciousIP.rapidRequests > 10) {
      confidence += 20;
      signals.push('rapid_requests');
    }
    if (suspiciousIP.uniquePaths > 50) {
      confidence += 15;
      signals.push('path_scanning');
    }
  }
  
  const isBot = confidence >= 50;
  const type = isBot ? 'suspicious' : 'human';
  
  const result = { isBot, confidence, signals, type, userAgent };
  
  // Cache the result
  botDetectionCache.set(cacheKey, { result, timestamp: Date.now() });
  
  return result;
}

function trackSuspiciousActivity(ip, path) {
  let activity = suspiciousIPs.get(ip);
  if (!activity) {
    activity = {
      rapidRequests: 0,
      uniquePaths: new Set(),
      firstSeen: Date.now(),
      lastSeen: Date.now()
    };
  }
  
  activity.rapidRequests++;
  activity.uniquePaths.add(path);
  activity.lastSeen = Date.now();
  
  // Reset counters if more than 1 hour has passed
  if (activity.lastSeen - activity.firstSeen > 60 * 60 * 1000) {
    activity.rapidRequests = 1;
    activity.uniquePaths = new Set([path]);
    activity.firstSeen = Date.now();
  }
  
  suspiciousIPs.set(ip, activity);
}

function logSecurityEvent(type, details) {
  if (!SECURITY_CONFIG.logging.enabled) return;
  
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    type,
    ...details
  };
  
  // In a production environment, you might want to send this to a logging service
  console.log(`[SECURITY] ${JSON.stringify(logEntry)}`);
}

function createSecurityResponse(message, status = 429, headers = {}) {
  return new Response(JSON.stringify({
    error: message,
    timestamp: new Date().toISOString()
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      ...headers
    }
  });
}

export async function onRequest(context, next) {
  const startTime = Date.now();
  const { request, url } = context;
  const ip = getClientIP(request);
  const path = url.pathname;
  const method = request.method;

  // Skip middleware for static files and health checks
  if (
    path === '/api/health' || 
    path === '/api/readiness' ||
    path === '/favicon.ico' ||
    path === '/manifest.json' ||
    path.startsWith('/favicon-') ||
    path === '/apple-touch-icon.png' ||
    path === '/robots.txt' ||
    path === '/.well-known/appspecific/com.chrome.devtools.json'
  ) {
    return await next();
  }
  
  // CDN detection and optimization
  const cdnInfo = detectCDN(request);
  const assetType = determineAssetType(path);
  const acceptEncoding = request.headers.get('accept-encoding');
  const preferredEncoding = getPreferredEncoding(acceptEncoding);
  
  // Handle Chrome DevTools requests cleanly
  if (path === '/.well-known/appspecific/com.chrome.devtools.json') {
    return new Response(null, { status: 204 });
  }
  
  // Track suspicious activity
  trackSuspiciousActivity(ip, path);
  
  // Rate limiting check
  const rateLimitResult = checkRateLimit(ip, path, SECURITY_CONFIG);
  if (!rateLimitResult.allowed) {
    if (SECURITY_CONFIG.logging.logRateLimit) {
      logSecurityEvent('rate_limit_exceeded', {
        ip,
        path,
        method,
        current: rateLimitResult.current,
        limit: rateLimitResult.limit
      });
    }
    
    const resetTime = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
    return createSecurityResponse('Rate limit exceeded', 429, {
      'X-RateLimit-Limit': rateLimitResult.limit.toString(),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': resetTime.toString(),
      'Retry-After': resetTime.toString()
    });
  }
  
  // Bot detection
  const botResult = detectBot(request, ip, SECURITY_CONFIG);
  
  // Store bot check result in locals for API handlers to use
  context.locals.botCheck = {
    status: botResult.isBot ? 'likely_bot' : 'likely_human',
    confidence: botResult.confidence,
    signals: botResult.signals,
    type: botResult.type,
    userAgent: botResult.userAgent || request.headers.get('user-agent')
  };
  
  // Store rate limit info in locals
  context.locals.rateLimit = {
    remaining: rateLimitResult.remaining,
    resetTime: rateLimitResult.resetTime
  };
  
  // Log suspicious bot activity
  if (botResult.isBot && botResult.type === 'suspicious' && SECURITY_CONFIG.logging.logSuspicious) {
    logSecurityEvent('suspicious_bot_detected', {
      ip,
      path,
      method,
      confidence: botResult.confidence,
      signals: botResult.signals,
      userAgent: botResult.userAgent
    });
  }
  
  // Block suspicious bots if configured
  if (botResult.isBot && botResult.type === 'suspicious' && SECURITY_CONFIG.botDetection.blockSuspiciousBots) {
    if (SECURITY_CONFIG.logging.logBlocked) {
      logSecurityEvent('bot_blocked', {
        ip,
        path,
        method,
        confidence: botResult.confidence,
        signals: botResult.signals
      });
    }
    
    return createSecurityResponse('Access denied', 403);
  }
  
  // Continue with request processing
  const response = await next();
  
  // Add CDN-optimized cache headers
  if (CDN_CONFIG.cdnOptimization.enabled) {
    const cacheControl = getCacheControlHeader(assetType, path);
    response.headers.set('Cache-Control', cacheControl);
    
    // Add Vary header for proper CDN caching
    const varyHeaders = ['Accept-Encoding'];
    if (assetType === 'page') {
      varyHeaders.push('Accept', 'Accept-Language');
    }
    response.headers.set('Vary', varyHeaders.join(', '));
    
    // Add ETag for better caching
    if (assetType !== 'page' && !response.headers.get('etag')) {
      const lastModified = response.headers.get('last-modified') || new Date().toUTCString();
      const etag = `"${Buffer.from(path + lastModified).toString('base64').slice(0, 16)}"`;
      response.headers.set('ETag', etag);
    }
    
    // Add compression hints for CDN
    if (shouldCompress(response.headers.get('content-type'))) {
      if (preferredEncoding && !response.headers.get('content-encoding')) {
        response.headers.set('X-Compress-Hint', preferredEncoding);
      }
    }
  }
  
  // Add security headers (CDN compatible)
  if (SECURITY_CONFIG.securityHeaders.enabled) {
    const headers = SECURITY_CONFIG.securityHeaders.headers;
    
    for (const [name, value] of Object.entries(headers)) {
      // Skip HSTS in development
      if (name === 'Strict-Transport-Security' && process.env.NODE_ENV === 'development') {
        continue;
      }
      
      // Don't override CDN-preserved headers
      if (!SECURITY_CONFIG.securityHeaders.preserveCdnHeaders.includes(name.toLowerCase())) {
        response.headers.set(name, value);
      }
    }
  }
  
  // Add rate limit headers
  if (rateLimitResult.remaining !== undefined) {
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    if (rateLimitResult.resetTime) {
      const resetTime = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      response.headers.set('X-RateLimit-Reset', resetTime.toString());
    }
  }
  
  // Add performance and monitoring headers
  const processingTime = Date.now() - startTime;
  response.headers.set('X-Response-Time', `${processingTime}ms`);
  
  // Add CDN information headers for debugging
  if (cdnInfo.provider) {
    response.headers.set('X-CDN-Provider', cdnInfo.provider);
    if (cdnInfo.cacheStatus) {
      response.headers.set('X-CDN-Cache', cdnInfo.cacheStatus);
    }
  }
  
  // Add asset type for debugging
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('X-Asset-Type', assetType);
  }
  
  return response;
}
