import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Whitelist of allowed hosts for production security
const ALLOWED_HOSTS = new Set([
  'palmisano.io',
  'www.palmisano.io', 
  'swe.palmisano.io',
  'csr.palmisano.io',
  // Development hosts
  'localhost:3000',
  '127.0.0.1:3000'
])

// Check if the host is a Vercel deployment URL
function isVercelHost(hostname: string): boolean {
  return hostname.endsWith('.vercel.app') || 
         hostname.endsWith('.vercel.sh') || 
         hostname.endsWith('-spaceplushy.vercel.app')
}

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  
  // Security: Validate host header against whitelist
  if (!ALLOWED_HOSTS.has(hostname) && !isVercelHost(hostname) && process.env.NODE_ENV === 'production') {
    return new NextResponse('Invalid host', { status: 400 })
  }
  
  // Extract and validate subdomain
  const parts = hostname.split('.')
  let subdomain = ''
  
  if (hostname === 'localhost:3000' || hostname === '127.0.0.1:3000') {
    // Development: check for port-based subdomain simulation
    subdomain = new URL(request.url).searchParams.get('variant') || 'csr'
  } else if (isVercelHost(hostname)) {
    // For Vercel deployments, default to CSR
    subdomain = 'csr'
  } else {
    subdomain = parts.length > 2 ? parts[0] : 'palmisano'
  }
  
  // Determine portfolio variant with strict validation
  let variant = 'csr' // Default to CSR instead of general
  if (subdomain === 'swe') {
    variant = 'swe'
  } else if (subdomain === 'csr') {
    variant = 'csr'
  } else if (subdomain === 'www' || subdomain === 'palmisano') {
    variant = 'csr' // Main domain defaults to CSR
  }
  
  // Create response with security headers
  const response = NextResponse.next()
  
  // Set variant header for components to access
  response.headers.set('x-subdomain', variant)
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // HSTS for production HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' vitals.vercel-insights.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' vitals.vercel-insights.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}