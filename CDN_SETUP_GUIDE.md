# CDN Configuration Guide for Portfolio Website

This guide provides comprehensive instructions for setting up and configuring CDN (Content Delivery Network) for the portfolio website deployed on Digital Ocean App Platform.

## Table of Contents

1. [Overview](#overview)
2. [Cloudflare CDN Setup](#cloudflare-cdn-setup)
3. [Digital Ocean Spaces CDN Setup](#digital-ocean-spaces-cdn-setup)
4. [Performance Optimizations](#performance-optimizations)
5. [Security Configuration](#security-configuration)
6. [Monitoring and Analytics](#monitoring-and-analytics)
7. [Troubleshooting](#troubleshooting)

## Overview

The portfolio website is optimized for CDN distribution with:

- **Intelligent caching** for different asset types
- **Compression** support (Brotli, Gzip)
- **Security headers** compatible with CDN edge locations
- **Performance monitoring** and analytics
- **Automatic cache invalidation** on deployments

### Current Configuration Files

- `/src/middleware.js` - Enhanced with CDN optimization
- `/public/_headers` - Static asset headers configuration
- `/cloudflare.json` - Cloudflare CDN configuration
- `/digitalocean-cdn.yaml` - Digital Ocean CDN configuration
- `/nginx-cdn.conf` - Nginx reverse proxy configuration
- `/cdn-security-config.js` - CDN-compatible security settings

## Cloudflare CDN Setup

### Prerequisites

1. Cloudflare account
2. Domain name managed by Cloudflare DNS
3. SSL certificate (Let's Encrypt or custom)

### Step 1: Domain Configuration

1. **Add your domain to Cloudflare:**
   ```bash
   # Update your domain's nameservers to Cloudflare's
   # This will be provided by Cloudflare when you add the domain
   ```

2. **Configure DNS records:**
   ```
   Type: A
   Name: @
   Content: [Your Digital Ocean App IP]
   Proxy status: Proxied (orange cloud)
   TTL: Auto
   
   Type: CNAME
   Name: www
   Content: your-domain.com
   Proxy status: Proxied (orange cloud)
   TTL: Auto
   ```

### Step 2: Apply Cloudflare Configuration

1. **Import configuration from cloudflare.json:**
   ```bash
   # Use Cloudflare API or dashboard to apply settings
   curl -X PUT "https://api.cloudflare.com/client/v4/zones/{zone_id}/settings" \
     -H "Authorization: Bearer {api_token}" \
     -H "Content-Type: application/json" \
     --data @cloudflare.json
   ```

2. **Key settings to verify:**
   - SSL/TLS: Full (strict)
   - Caching Level: Standard
   - Browser Cache TTL: 4 hours
   - Always Online: On
   - Brotli Compression: On

### Step 3: Page Rules Configuration

Configure page rules in this priority order:

1. **Static Assets (Priority 1):**
   ```
   Pattern: *.yourdomain.com/*.(css|js|png|jpg|jpeg|gif|webp|avif|svg|ico|woff|woff2|ttf|eot|otf)
   Settings:
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 year
   - Browser Cache TTL: 1 year
   ```

2. **API Routes (Priority 2):**
   ```
   Pattern: *.yourdomain.com/api/*
   Settings:
   - Cache Level: Bypass
   ```

3. **HTML Pages (Priority 3):**
   ```
   Pattern: *.yourdomain.com/*
   Settings:
   - Cache Level: Standard
   - Edge Cache TTL: 1 day
   - Browser Cache TTL: 5 minutes
   ```

### Step 4: Security Configuration

1. **Firewall Rules:**
   ```javascript
   // Block suspicious bots
   (cf.bot_management.score lt 30 and not cf.bot_management.verified_bot)
   Action: Challenge
   
   // Rate limit API endpoints
   (http.request.uri.path matches "^/api/.*")
   Action: Rate Limit (30 requests per minute)
   ```

2. **Security Level:** Medium
3. **DDoS Protection:** Enabled
4. **Bot Fight Mode:** Enabled

## Digital Ocean Spaces CDN Setup

### Prerequisites

1. Digital Ocean account
2. Spaces bucket created
3. Domain name (optional)

### Step 1: Create Spaces Bucket

```bash
# Create a new Spaces bucket
doctl spaces create portfolio-cdn --region nyc3

# Configure CORS if needed
doctl spaces configure-cors portfolio-cdn --cors-rules-file cors-config.json
```

### Step 2: Enable CDN

1. **Through Digital Ocean Control Panel:**
   - Navigate to Spaces
   - Select your bucket
   - Go to Settings tab
   - Enable CDN
   - Configure custom domain (optional)

2. **Using the API:**
   ```bash
   curl -X POST "https://api.digitalocean.com/v2/cdn/endpoints" \
     -H "Authorization: Bearer $DO_API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "origin": "portfolio-cdn.nyc3.digitaloceanspaces.com",
       "custom_domain": "cdn.yourdomain.com",
       "certificate_id": "your-certificate-id"
     }'
   ```

### Step 3: Configure App Platform

Update your `app.yaml` to include CDN settings:

```yaml
name: portfolio
services:
- name: web
  # ... existing configuration
  envs:
  - key: CDN_ENDPOINT
    value: "https://portfolio-cdn.nyc3.cdn.digitaloceanspaces.com"
  - key: CDN_ENABLED
    value: "true"
```

## Performance Optimizations

### Cache Strategy

The application implements a tiered caching strategy:

1. **Browser Cache (Client-side):**
   - Static assets: 1 year
   - HTML pages: 5 minutes
   - API responses: No cache

2. **CDN Edge Cache:**
   - Static assets: 1 year
   - HTML pages: 1 day
   - Images: 30 days

3. **Origin Cache:**
   - Implemented via middleware
   - Intelligent cache headers
   - ETags for validation

### Compression Configuration

The middleware automatically handles compression:

```javascript
// Compression is enabled for:
const compressibleTypes = [
  'text/',
  'application/javascript',
  'application/json',
  'application/xml',
  'image/svg+xml'
];

// Compression algorithms (in preference order):
const algorithms = ['br', 'gzip', 'deflate'];
```

### Image Optimization

1. **WebP/AVIF Support:**
   - Automatic format conversion at CDN level
   - Fallback to original format

2. **Responsive Images:**
   - Different sizes served based on device
   - Lazy loading implementation

## Security Configuration

### Headers Configuration

The application sets security headers compatible with CDN:

```javascript
// Core security headers
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
};
```

### Content Security Policy

CSP is configured to work with CDN domains:

```
default-src 'self';
script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: https: blob:;
font-src 'self' data: https://fonts.gstatic.com;
```

### Rate Limiting

Multi-level rate limiting:

1. **CDN Level:** 200 requests/minute globally
2. **Origin Level:** 50 requests/minute per IP
3. **API Level:** 30 requests/minute for API endpoints

## Monitoring and Analytics

### Performance Monitoring

1. **Core Web Vitals:**
   - Largest Contentful Paint (LCP)
   - First Input Delay (FID)
   - Cumulative Layout Shift (CLS)

2. **CDN Metrics:**
   - Cache hit ratio
   - Origin response time
   - Edge response time
   - Bandwidth usage

### Health Checks

The application provides health check endpoints:

```javascript
// Available endpoints:
GET /api/health       // Basic health check
GET /api/metrics      // Performance metrics
GET /api/cache-status // Cache status information
```

### Logging

CDN and security events are logged:

```javascript
// Log types:
- rate_limit_exceeded
- suspicious_bot_detected
- bot_blocked
- cdn_cache_miss
- performance_degradation
```

## Deployment Integration

### Automatic Cache Purging

Configure automatic cache purging on deployment:

```bash
# Cloudflare purge
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'

# Digital Ocean CDN purge
curl -X DELETE "https://api.digitalocean.com/v2/cdn/endpoints/{endpoint_id}/cache" \
  -H "Authorization: Bearer $DO_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"files":["*"]}'
```

### Environment Variables

Add these environment variables to your Digital Ocean App:

```yaml
envs:
- key: CDN_OPTIMIZATION_ENABLED
  value: "true"
- key: COMPRESSION_ENABLED
  value: "true"
- key: CACHE_STATIC_ASSETS
  value: "true"
- key: CDN_PROVIDER
  value: "cloudflare" # or "digitalocean"
```

## Performance Benchmarks

Expected performance improvements with CDN:

- **Page Load Time:** 40-60% reduction
- **Time to First Byte (TTFB):** 70-80% reduction
- **Bandwidth Usage:** 30-50% reduction
- **Origin Server Load:** 60-80% reduction

## Troubleshooting

### Common Issues

1. **Cache Not Working:**
   ```bash
   # Check cache headers
   curl -I https://yourdomain.com/some-asset.css
   
   # Look for:
   # Cache-Control: public, max-age=31536000
   # X-Cache: HIT (Cloudflare) or MISS (if not cached)
   ```

2. **Security Headers Missing:**
   ```bash
   # Check security headers
   curl -I https://yourdomain.com/
   
   # Verify presence of:
   # X-Frame-Options, X-Content-Type-Options, etc.
   ```

3. **Compression Not Working:**
   ```bash
   # Test compression
   curl -H "Accept-Encoding: gzip,br" -I https://yourdomain.com/
   
   # Look for:
   # Content-Encoding: br (or gzip)
   ```

### Debug Mode

Enable debug mode in development:

```bash
export NODE_ENV=development
export CDN_DEBUG=true
```

This will add debug headers:
- `X-CDN-Provider`: Detected CDN provider
- `X-Asset-Type`: Classified asset type
- `X-Cache-Status`: Cache decision reasoning

### Performance Testing

Use these tools to test CDN performance:

1. **WebPageTest:** https://webpagetest.org
2. **GTmetrix:** https://gtmetrix.com
3. **Lighthouse:** Built into Chrome DevTools
4. **CDN Speed Test:** Test from multiple locations

### Monitoring Alerts

Set up alerts for:

- Cache hit ratio below 80%
- Origin response time above 500ms
- Error rate above 1%
- Security incidents

## Best Practices

1. **Cache Invalidation:**
   - Use versioned filenames for assets
   - Purge selectively, not everything
   - Test cache behavior in staging

2. **Security:**
   - Regularly update security headers
   - Monitor for new threats
   - Use CDN's security features

3. **Performance:**
   - Monitor Core Web Vitals
   - Optimize images and assets
   - Use HTTP/2 Push for critical resources

4. **Maintenance:**
   - Regular CDN configuration reviews
   - Performance audits
   - Security assessments

## Support and Resources

- **Cloudflare Documentation:** https://developers.cloudflare.com/
- **Digital Ocean Spaces CDN:** https://docs.digitalocean.com/products/spaces/how-to/enable-cdn/
- **Web Performance:** https://web.dev/performance/
- **Security Headers:** https://securityheaders.com/

For issues specific to this implementation, check the application logs and CDN dashboard metrics.