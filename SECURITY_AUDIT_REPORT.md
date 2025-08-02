# Security Audit Report - Portfolio Website

**Date:** August 2, 2025  
**Auditor:** Security Audit Team  
**Branch:** build-fixes  
**Scope:** Complete security review of portfolio website codebase

## Executive Summary

This security audit identifies vulnerabilities, security risks, and OWASP compliance issues in the portfolio website. The audit found several HIGH and MEDIUM severity issues that require immediate attention, particularly around API endpoint security, CORS configuration, and input validation.

## Risk Rating Scale

- **Critical**: Immediate exploitation possible, severe impact
- **High**: Significant security risk, should be fixed urgently
- **Medium**: Moderate risk, should be addressed in next release
- **Low**: Minor risk, best practice recommendation

---

## 1. API Endpoint Security

### 1.1 Unrestricted CORS Configuration
**Severity:** HIGH  
**OWASP:** A05:2021 - Security Misconfiguration  
**Location:** `/src/pages/api/image-optimize.js` (lines 211-213, 371-373, 404-407)

**Finding:**
```javascript
'Access-Control-Allow-Origin': '*',
'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
'Access-Control-Allow-Headers': 'Content-Type, Accept',
```

The API endpoint allows requests from any origin (`*`), which could enable:
- Cross-site data theft
- Unauthorized API usage
- Resource exhaustion attacks from any domain

**Remediation:**
```javascript
// Define allowed origins
const ALLOWED_ORIGINS = [
  'https://palmisano.io',
  'https://www.palmisano.io',
  process.env.NODE_ENV === 'development' ? 'http://localhost:4321' : null
].filter(Boolean);

// Implement origin validation
const origin = request.headers.get('origin');
const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
response.headers.set('Access-Control-Allow-Credentials', 'true');
response.headers.set('Vary', 'Origin');
```

### 1.2 Missing Authentication on API Endpoints
**Severity:** HIGH  
**OWASP:** A01:2021 - Broken Access Control  
**Location:** All API endpoints (`/api/health`, `/api/monitoring`, `/api/image-optimize`)

**Finding:**
No authentication mechanisms are implemented. Any user can access:
- Health check data exposing system information
- Monitoring metrics revealing performance data
- Image optimization services consuming server resources

**Remediation:**
```javascript
// Implement API key authentication
const API_KEY = process.env.API_KEY;

export async function authenticate(request) {
  const apiKey = request.headers.get('X-API-Key');
  
  if (!apiKey || apiKey !== API_KEY) {
    return new Response('Unauthorized', { 
      status: 401,
      headers: { 'WWW-Authenticate': 'Bearer' }
    });
  }
  return null; // authenticated
}

// Use in endpoints
export async function GET({ request, url }) {
  const authError = authenticate(request);
  if (authError) return authError;
  
  // ... rest of handler
}
```

### 1.3 Information Disclosure in Health Endpoint
**Severity:** MEDIUM  
**OWASP:** A05:2021 - Security Misconfiguration  
**Location:** `/src/pages/api/health.js` (lines 54-60)

**Finding:**
The health endpoint exposes sensitive system information:
```javascript
environment: {
  node_version: process.version,
  port: process.env.PORT || 8080,
  environment: process.env.NODE_ENV || 'production'
}
```

**Remediation:**
Limit exposed information in production:
```javascript
if (verbose && process.env.NODE_ENV === 'development') {
  health.environment = {
    node_version: process.version,
    port: process.env.PORT || 8080,
    environment: process.env.NODE_ENV
  };
}
```

---

## 2. Input Validation and Sanitization

### 2.1 Insufficient Input Validation in Image Optimization
**Severity:** MEDIUM  
**OWASP:** A03:2021 - Injection  
**Location:** `/src/pages/api/image-optimize.js` (lines 19-51)

**Finding:**
While basic validation exists, it lacks:
- URL validation for `src` parameter
- Path traversal prevention
- File type validation

**Remediation:**
```javascript
function validateParams(params) {
  const errors = [];
  
  // Validate src URL
  if (!params.src) {
    errors.push('src parameter is required');
  } else {
    try {
      const url = new URL(params.src);
      // Whitelist allowed protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.push('Invalid URL protocol');
      }
      // Prevent local file access
      if (['localhost', '127.0.0.1', '0.0.0.0'].includes(url.hostname)) {
        errors.push('Local URLs not allowed');
      }
    } catch (e) {
      errors.push('Invalid URL format');
    }
  }
  
  // Validate file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];
  const ext = params.src.toLowerCase().split('.').pop();
  if (!allowedExtensions.some(allowed => params.src.toLowerCase().endsWith(allowed))) {
    errors.push('Invalid file type');
  }
  
  // ... existing validations
}
```

### 2.2 Missing Rate Limiting on Resource-Intensive Operations
**Severity:** MEDIUM  
**OWASP:** A04:2021 - Insecure Design  
**Location:** `/src/pages/api/image-optimize.js`

**Finding:**
The image optimization endpoint lacks specific rate limiting for resource-intensive operations, relying only on global middleware rate limits.

**Remediation:**
```javascript
// Add operation-specific rate limiting
const imageOptimizationLimiter = new Map();

function checkImageRateLimit(ip) {
  const key = `image:${ip}`;
  const now = Date.now();
  const limit = { count: 10, window: 60000 }; // 10 requests per minute
  
  let record = imageOptimizationLimiter.get(key);
  if (!record || now - record.start > limit.window) {
    record = { start: now, count: 0 };
  }
  
  record.count++;
  imageOptimizationLimiter.set(key, record);
  
  return record.count <= limit.count;
}
```

---

## 3. Security Headers

### 3.1 Weak Content Security Policy
**Severity:** MEDIUM  
**OWASP:** A05:2021 - Security Misconfiguration  
**Location:** `/src/middleware.js` (line 78)

**Finding:**
CSP allows `unsafe-inline` and `unsafe-eval` for scripts:
```javascript
"script-src 'self' 'unsafe-inline' 'unsafe-eval' ..."
```

**Remediation:**
```javascript
// Generate nonces for inline scripts
const nonce = crypto.randomBytes(16).toString('base64');

// Updated CSP
`Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com; ...`

// Add nonce to response context
context.locals.nonce = nonce;
```

### 3.2 Missing Security Headers in API Responses
**Severity:** LOW  
**OWASP:** A05:2021 - Security Misconfiguration  
**Location:** API endpoints

**Finding:**
API responses don't include security headers like `X-Content-Type-Options`, `X-Frame-Options`.

**Remediation:**
Add security headers to all API responses:
```javascript
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};
```

---

## 4. Bot Detection and Rate Limiting

### 4.1 Bypassable Bot Detection
**Severity:** LOW  
**OWASP:** A04:2021 - Insecure Design  
**Location:** `/src/middleware.js` (lines 311-414)

**Finding:**
Bot detection relies solely on User-Agent and header analysis, which can be easily spoofed.

**Remediation:**
Implement additional behavioral analysis:
```javascript
// Add challenge-response for suspicious traffic
if (botResult.confidence > 70 && botResult.type === 'suspicious') {
  // Implement CAPTCHA or proof-of-work challenge
  return new Response('Challenge required', {
    status: 403,
    headers: {
      'X-Challenge-Type': 'captcha',
      'X-Challenge-URL': '/api/challenge'
    }
  });
}
```

---

## 5. Docker and Deployment Security

### 5.1 Running as Root User During Build
**Severity:** LOW  
**OWASP:** A05:2021 - Security Misconfiguration  
**Location:** `Dockerfile` (lines 1-92)

**Finding:**
Build stages run as root before switching to nodejs user.

**Remediation:**
Already properly configured - switches to non-root user for runtime (line 124).

### 5.2 Exposed Port in Docker
**Severity:** LOW  
**Location:** `Dockerfile` (line 126)

**Finding:**
Port 8080 is exposed but this is standard practice.

**Remediation:**
No action needed - this is correct configuration.

---

## 6. Dependency Security

### 6.1 Dependency Audit Required
**Severity:** MEDIUM  
**OWASP:** A06:2021 - Vulnerable and Outdated Components

**Finding:**
No automated dependency scanning configured.

**Remediation:**
```json
// Add to package.json scripts
"audit": "npm audit --production",
"audit:fix": "npm audit fix --production"

// Add to CI/CD pipeline
"preinstall": "npm audit --production"
```

---

## 7. Data Exposure Risks

### 7.1 Redis URL Exposure in Monitoring
**Severity:** HIGH  
**OWASP:** A01:2021 - Broken Access Control  
**Location:** `/src/pages/api/monitoring.js` (line 283)

**Finding:**
Redis URL is partially masked but still reveals connection details:
```javascript
url: process.env.REDIS_URL.replace(/:[^:]*@/, ':***@')
```

**Remediation:**
```javascript
// Don't expose connection details at all
redis: {
  status: 'healthy',
  latency: `${latency}ms`,
  // Remove URL completely
  connected: true
}
```

### 7.2 Contact Information in Source
**Severity:** LOW  
**Location:** `/src/config/contact.ts`

**Finding:**
Personal contact information is hardcoded as fallback values.

**Remediation:**
Move all contact information to environment variables only:
```typescript
export const CONTACT_INFO: ContactInfo = {
  email: import.meta.env.CONTACT_EMAIL || 'contact@example.com',
  phone: {
    raw: import.meta.env.CONTACT_PHONE_RAW || '',
    formatted: import.meta.env.CONTACT_PHONE_FORMATTED || '',
  }
  // ...
};
```

---

## 8. Middleware Security

### 8.1 Insufficient Request Validation
**Severity:** MEDIUM  
**OWASP:** A04:2021 - Insecure Design  
**Location:** `/src/middleware.js`

**Finding:**
Middleware doesn't validate request size or content types.

**Remediation:**
```javascript
// Add request size limits
const MAX_REQUEST_SIZE = 10 * 1024 * 1024; // 10MB

if (request.headers.get('content-length') > MAX_REQUEST_SIZE) {
  return new Response('Request too large', { status: 413 });
}

// Validate content types for POST requests
if (request.method === 'POST') {
  const contentType = request.headers.get('content-type');
  const allowedTypes = ['application/json', 'multipart/form-data'];
  
  if (!allowedTypes.some(type => contentType?.includes(type))) {
    return new Response('Invalid content type', { status: 415 });
  }
}
```

---

## Summary of Findings

| Severity | Count | Issues |
|----------|-------|--------|
| Critical | 0 | None found |
| High | 4 | Unrestricted CORS, Missing Authentication, Redis URL Exposure, No API Authentication |
| Medium | 5 | Information Disclosure, Input Validation, Rate Limiting, Weak CSP, Dependency Audit |
| Low | 4 | API Security Headers, Bot Detection, Docker Config, Contact Info |

---

## Immediate Action Items

1. **Implement API Authentication** - Add API key authentication to all endpoints
2. **Fix CORS Configuration** - Restrict to specific allowed origins
3. **Remove Sensitive Data** - Remove Redis URL and system info from responses
4. **Add Input Validation** - Strengthen URL and file type validation
5. **Update CSP** - Remove unsafe-inline and unsafe-eval

## Security Checklist

- [ ] Implement API authentication mechanism
- [ ] Configure CORS with specific allowed origins
- [ ] Add comprehensive input validation
- [ ] Remove sensitive information from API responses
- [ ] Implement rate limiting for resource-intensive operations
- [ ] Add security headers to all API responses
- [ ] Set up dependency vulnerability scanning
- [ ] Implement request size and content type validation
- [ ] Add behavioral bot detection
- [ ] Configure CSP without unsafe directives
- [ ] Set up security monitoring and alerting
- [ ] Implement API versioning for future changes
- [ ] Add request signing for critical operations
- [ ] Implement audit logging for security events

## OWASP Top 10 Coverage

| OWASP Category | Issues Found | Status |
|----------------|--------------|--------|
| A01: Broken Access Control | Missing API auth, Redis URL exposure | ❌ High Risk |
| A02: Cryptographic Failures | None found | ✅ OK |
| A03: Injection | Basic input validation gaps | ⚠️ Medium Risk |
| A04: Insecure Design | Rate limiting, bot detection | ⚠️ Medium Risk |
| A05: Security Misconfiguration | CORS, CSP, Info disclosure | ❌ High Risk |
| A06: Vulnerable Components | No dependency scanning | ⚠️ Medium Risk |
| A07: Auth and Session | No auth implemented | ❌ High Risk |
| A08: Software and Data Integrity | None found | ✅ OK |
| A09: Security Logging | Limited security logging | ⚠️ Medium Risk |
| A10: SSRF | Basic URL validation | ⚠️ Medium Risk |

---

## Conclusion

The portfolio website has several significant security vulnerabilities that should be addressed before production deployment. The most critical issues are the lack of API authentication and unrestricted CORS configuration. Implementing the recommended remediations will significantly improve the security posture of the application.

**Next Steps:**
1. Prioritize HIGH severity issues for immediate remediation
2. Implement security testing in CI/CD pipeline
3. Schedule regular security audits
4. Consider implementing a Web Application Firewall (WAF)
5. Set up security monitoring and incident response procedures