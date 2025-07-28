import { checkBotId } from './lib/bot-protection.js';

/**
 * Middleware for security and request handling
 * 
 * SECURITY FEATURES:
 * - Bot protection for API routes
 * - Security headers for all responses
 * - Request logging for monitoring
 * - Rate limiting (placeholder)
 * 
 * SECURITY CONSIDERATIONS:
 * - All API routes should be protected by bot detection
 * - Security headers prevent common attacks (XSS, clickjacking)
 * - Logging helps detect and respond to attacks
 * - Rate limiting prevents abuse
 */
export async function onRequest(context, next) {
  const { url, request } = context;
  const startTime = Date.now();

  try {
    // Handle Chrome DevTools requests cleanly
    if (url.pathname === '/.well-known/appspecific/com.chrome.devtools.json') {
      // Return 204 No Content to prevent 404 logs
      return new Response(null, { status: 204 });
    }

    // Security headers for all responses
    const securityHeaders = {
      // Prevent XSS attacks
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
      // Strict transport security (HTTPS only)
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      // Content Security Policy (basic protection)
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://vitals.vercel-insights.com https://api.vercel.com;",
      // Referrer policy
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      // Permissions policy
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    };

    // Bot protection for API routes
    if (url.pathname.startsWith('/api/')) {
      console.log(`API request: ${request.method} ${url.pathname} from ${getClientIP(request)}`);
      
      // Perform bot check for API routes
      const botCheck = await checkBotId(request);
      
      // Log security events
      if (botCheck.securityFlags.length > 0) {
        console.warn(`Security flags for ${url.pathname}:`, botCheck.securityFlags);
      }

      // Block suspicious requests
      if (botCheck.status === 'likely_bot' || botCheck.status === 'suspicious') {
        const responseTime = Date.now() - startTime;
        console.warn(`Blocked ${botCheck.status} request: ${request.method} ${url.pathname} (${responseTime}ms)`, {
          ip: getClientIP(request),
          userAgent: request.headers.get('user-agent'),
          confidence: botCheck.confidence,
          flags: botCheck.securityFlags,
        });

        return new Response(
          JSON.stringify({ 
            error: 'Request blocked by security system',
            code: 'SECURITY_BLOCK',
            timestamp: new Date().toISOString(),
          }), 
          { 
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              ...securityHeaders,
            },
          }
        );
      }

      // Add bot check result to context for API handlers
      context.locals = {
        ...context.locals,
        botCheck,
        clientIP: getClientIP(request),
        requestStartTime: startTime,
      };
    }

    // Process the request
    const response = await next();

    // Add security headers to response
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Log response (non-API routes)
    if (!url.pathname.startsWith('/api/')) {
      const responseTime = Date.now() - startTime;
      console.log(`${request.method} ${url.pathname} - ${response.status} (${responseTime}ms)`);
    }

    return response;

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`Middleware error for ${request.method} ${url.pathname} (${responseTime}ms):`, error);

    // Return generic error response to prevent information leakage
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        code: 'MIDDLEWARE_ERROR',
        timestamp: new Date().toISOString(),
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...securityHeaders,
        },
      }
    );
  }
}

/**
 * Extract client IP from request headers
 * Handles various proxy configurations
 */
function getClientIP(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         request.headers.get('x-real-ip') ||
         request.headers.get('cf-connecting-ip') ||
         'unknown';
}