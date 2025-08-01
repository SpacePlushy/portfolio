// =============================================================================
// SECURITY MIDDLEWARE IMPLEMENTATION
// =============================================================================
// Production-ready security middleware for image optimization system

import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import helmet from 'helmet';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import validator from 'validator';
import { createHash } from 'crypto';

// =============================================================================
// RATE LIMITING MIDDLEWARE
// =============================================================================

// Global rate limiter
export const globalRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // requests per minute
  message: {
    error: 'Too many requests from this IP',
    retryAfter: '60 seconds'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  }
});

// Image upload rate limiter
export const imageUploadRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // uploads per minute
  message: {
    error: 'Too many image uploads from this IP',
    retryAfter: '60 seconds'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use IP + User-Agent for more granular limiting
    return `${req.ip}-${createHash('md5').update(req.get('User-Agent') || '').digest('hex')}`;
  }
});

// API endpoint rate limiter
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // requests per minute
  message: {
    error: 'API rate limit exceeded',
    retryAfter: '60 seconds'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Progressive delay for repeated requests
export const progressiveDelay = slowDown({
  windowMs: 60 * 1000, // 1 minute
  delayAfter: 50, // allow 50 requests per minute at full speed
  delayMs: 500, // add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // max 20 second delay
  skipSuccessfulRequests: true
});

// =============================================================================
// SECURITY HEADERS MIDDLEWARE
// =============================================================================

export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },
  
  // HSTS
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  // Additional security headers
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  
  // Permissions Policy
  permissionsPolicy: {
    features: {
      camera: [],
      microphone: [],
      geolocation: [],
      payment: [],
      usb: [],
      magnetometer: [],
      gyroscope: [],
      accelerometer: []
    }
  }
});

// =============================================================================
// CORS MIDDLEWARE
// =============================================================================

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://frankpalmisano.com',
      'https://www.frankpalmisano.com',
      'https://portfolio-staging.ondigitalocean.app'
    ];
    
    // Allow localhost in development
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:4321', 'http://localhost:3000');
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Accept',
    'Origin',
    'User-Agent',
    'Cache-Control'
  ],
  maxAge: 86400, // 24 hours
  credentials: false
});

// =============================================================================
// FILE UPLOAD SECURITY MIDDLEWARE
// =============================================================================

export const secureFileUpload = fileUpload({
  // File size limits
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1 // Only one file at a time
  },
  
  // Security options
  abortOnLimit: true,
  responseOnLimit: 'File size limit exceeded (10MB maximum)',
  limitHandler: (req, res) => {
    res.status(413).json({
      error: 'File too large',
      maxSize: '10MB'
    });
  },
  
  // Use temp directory for uploads
  useTempFiles: true,
  tempFileDir: '/tmp/uploads/',
  
  // Cleanup temp files
  createParentPath: true,
  safeFileNames: true,
  preserveExtension: true
});

// =============================================================================
// INPUT VALIDATION MIDDLEWARE
// =============================================================================

export const validateImageUpload = (req, res, next) => {
  try {
    // Check if file exists
    if (!req.files || !req.files.image) {
      return res.status(400).json({
        error: 'No image file provided'
      });
    }
    
    const file = req.files.image;
    
    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      return res.status(413).json({
        error: 'File size exceeds 10MB limit'
      });
    }
    
    if (file.size < 1024) {
      return res.status(400).json({
        error: 'File size too small (minimum 1KB)'
      });
    }
    
    // Validate MIME type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff'
    ];
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({
        error: 'Invalid file type',
        allowedTypes: allowedMimeTypes
      });
    }
    
    // Validate file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({
        error: 'Invalid file extension',
        allowedExtensions
      });
    }
    
    // Validate filename
    if (!validator.matches(file.name, /^[a-zA-Z0-9._-]+$/)) {
      return res.status(400).json({
        error: 'Invalid filename. Only alphanumeric characters, dots, underscores, and hyphens allowed'
      });
    }
    
    if (file.name.length > 255) {
      return res.status(400).json({
        error: 'Filename too long (maximum 255 characters)'
      });
    }
    
    next();
  } catch (error) {
    console.error('File validation error:', error);
    res.status(500).json({
      error: 'File validation failed'
    });
  }
};

// =============================================================================
// REQUEST VALIDATION MIDDLEWARE
// =============================================================================

export const validateRequest = (req, res, next) => {
  try {
    // Validate request size
    const contentLength = parseInt(req.get('Content-Length') || '0');
    if (contentLength > 15 * 1024 * 1024) { // 15MB
      return res.status(413).json({
        error: 'Request too large'
      });
    }
    
    // Validate required headers
    const userAgent = req.get('User-Agent');
    if (!userAgent || userAgent.length < 3) {
      return res.status(400).json({
        error: 'Valid User-Agent header required'
      });
    }
    
    // Block suspicious user agents
    const suspiciousPatterns = [
      /bot|crawler|spider|scraper/i,
      /sqlmap|nmap|nikto|dirb/i,
      /curl|wget|python-requests/i
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
      return res.status(403).json({
        error: 'Blocked user agent'
      });
    }
    
    // Validate query parameters
    const queryString = req.url.split('?')[1];
    if (queryString && queryString.length > 2048) {
      return res.status(414).json({
        error: 'Query string too long'
      });
    }
    
    // Check for suspicious patterns in request
    const suspiciousRequestPatterns = [
      /<script|<iframe|<object|<embed/i,
      /union.*select|select.*from/i,
      /script.*src|javascript:/i,
      /eval\(|function\(/i
    ];
    
    const requestStr = JSON.stringify(req.body) + req.url;
    if (suspiciousRequestPatterns.some(pattern => pattern.test(requestStr))) {
      return res.status(400).json({
        error: 'Suspicious request content detected'
      });
    }
    
    next();
  } catch (error) {
    console.error('Request validation error:', error);
    res.status(500).json({
      error: 'Request validation failed'
    });
  }
};

// =============================================================================
// IP FILTERING MIDDLEWARE
// =============================================================================

// Simple in-memory store for blocked IPs (use Redis in production)
const blockedIPs = new Set();
const ipAttempts = new Map();

export const ipFilterMiddleware = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // Check if IP is blocked
  if (blockedIPs.has(clientIP)) {
    return res.status(403).json({
      error: 'IP address blocked'
    });
  }
  
  // Track failed requests per IP
  const attempts = ipAttempts.get(clientIP) || { count: 0, lastAttempt: Date.now() };
  
  // Reset attempts if more than 1 hour has passed
  if (Date.now() - attempts.lastAttempt > 3600000) {
    attempts.count = 0;
  }
  
  // Block IP if too many failed attempts
  if (attempts.count > 10) {
    blockedIPs.add(clientIP);
    console.warn(`Blocked IP ${clientIP} for excessive failed attempts`);
    
    return res.status(403).json({
      error: 'IP address blocked due to suspicious activity'
    });
  }
  
  // Add middleware to track failed requests
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      attempts.count++;
      attempts.lastAttempt = Date.now();
      ipAttempts.set(clientIP, attempts);
    }
  });
  
  next();
};

// =============================================================================
// MALWARE SCANNING MIDDLEWARE
// =============================================================================

export const malwareScanMiddleware = async (req, res, next) => {
  // Skip if no file uploaded
  if (!req.files || !req.files.image) {
    return next();
  }
  
  try {
    const file = req.files.image;
    
    // Basic file signature validation
    const buffer = file.data;
    const signature = buffer.slice(0, 4).toString('hex');
    
    // Known malicious signatures (basic check)
    const maliciousSignatures = [
      '4d5a9000', // PE executable
      '7f454c46', // ELF executable
      '25504446', // PDF (can contain malicious scripts)
    ];
    
    if (maliciousSignatures.includes(signature)) {
      console.warn(`Malicious file signature detected: ${signature}`);
      return res.status(400).json({
        error: 'File appears to contain malicious content'
      });
    }
    
    // Validate image header more thoroughly
    const isValidImage = await validateImageHeader(buffer, file.mimetype);
    if (!isValidImage) {
      return res.status(400).json({
        error: 'Invalid image file structure'
      });
    }
    
    next();
  } catch (error) {
    console.error('Malware scan error:', error);
    res.status(500).json({
      error: 'Security scan failed'
    });
  }
};

// Helper function to validate image headers
async function validateImageHeader(buffer, mimeType) {
  try {
    const signatures = {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
      'image/gif': [0x47, 0x49, 0x46, 0x38],
      'image/webp': [0x52, 0x49, 0x46, 0x46],
      'image/bmp': [0x42, 0x4D]
    };
    
    const expectedSignature = signatures[mimeType];
    if (!expectedSignature) return false;
    
    for (let i = 0; i < expectedSignature.length; i++) {
      if (buffer[i] !== expectedSignature[i]) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Image header validation error:', error);
    return false;
  }
}

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================

export const securityErrorHandler = (error, req, res, next) => {
  console.error('Security middleware error:', error);
  
  // Don't expose internal error details
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (error.message && error.message.includes('CORS')) {
    return res.status(403).json({
      error: 'CORS policy violation'
    });
  }
  
  if (error.message && error.message.includes('rate limit')) {
    return res.status(429).json({
      error: 'Rate limit exceeded'
    });
  }
  
  // Generic error response
  res.status(500).json({
    error: isDevelopment ? error.message : 'Internal server error'
  });
};

// =============================================================================
// SECURITY MONITORING MIDDLEWARE
// =============================================================================

export const securityMonitoring = (req, res, next) => {
  // Log security events
  const securityEvent = {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    method: req.method,
    path: req.path,
    contentLength: req.get('Content-Length')
  };
  
  // Log suspicious activity
  if (req.path.includes('..') || req.path.includes('<script>')) {
    console.warn('Suspicious request detected:', securityEvent);
  }
  
  // Track response for monitoring
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      console.log('Security event:', {
        ...securityEvent,
        statusCode: res.statusCode,
        responseTime: Date.now() - req.startTime
      });
    }
  });
  
  req.startTime = Date.now();
  next();
};

// =============================================================================
// COMBINED SECURITY MIDDLEWARE STACK
// =============================================================================

export const securityStack = [
  securityMonitoring,
  securityHeaders,
  corsMiddleware,
  globalRateLimit,
  progressiveDelay,
  ipFilterMiddleware,
  validateRequest,
  securityErrorHandler
];

export const imageUploadSecurityStack = [
  securityMonitoring,
  securityHeaders,
  corsMiddleware,
  imageUploadRateLimit,
  secureFileUpload,
  validateImageUpload,
  malwareScanMiddleware,
  securityErrorHandler
];

export default {
  securityStack,
  imageUploadSecurityStack,
  globalRateLimit,
  imageUploadRateLimit,
  apiRateLimit,
  securityHeaders,
  corsMiddleware,
  validateImageUpload,
  validateRequest,
  ipFilterMiddleware,
  malwareScanMiddleware,
  securityErrorHandler,
  securityMonitoring
};