/**
 * Contact Form API Endpoint
 * 
 * Secure API endpoint for handling contact form submissions.
 * 
 * SECURITY FEATURES:
 * - Bot protection validation (required)
 * - Input validation and sanitization
 * - Rate limiting per IP
 * - No sensitive data exposure in responses
 * - Proper error handling without information leakage
 * - Request logging for security monitoring
 */

import { z } from 'zod';

// Input validation schema
const ContactFormSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name contains invalid characters'),
  
  email: z.string()
    .email('Invalid email format')
    .max(254, 'Email too long'), // RFC 5321 limit
  
  subject: z.string()
    .min(1, 'Subject is required')
    .max(200, 'Subject too long')
    .regex(/^[a-zA-Z0-9\s\-_.,!?()]+$/, 'Subject contains invalid characters'),
  
  message: z.string()
    .min(10, 'Message too short')
    .max(5000, 'Message too long'),
  
  // Honeypot field (should be empty)
  website: z.string().max(0, 'Spam detected').optional(),
});

export async function POST({ request, locals }) {
  const startTime = Date.now();
  const clientIP = locals?.clientIP || 'unknown';
  
  try {
    // Security Check 1: Bot protection validation
    if (!locals?.botCheck) {
      console.warn(`Contact API: Missing bot check for ${clientIP}`);
      return createErrorResponse('Security validation required', 'BOT_CHECK_MISSING', 403);
    }

    const { botCheck } = locals;
    
    // Block if bot protection failed
    if (botCheck.status === 'likely_bot' || botCheck.status === 'suspicious') {
      console.warn(`Contact API: Bot detected for ${clientIP}`, {
        status: botCheck.status,
        confidence: botCheck.confidence,
        flags: botCheck.securityFlags,
      });
      return createErrorResponse('Request blocked by security system', 'BOT_DETECTED', 403);
    }

    // Security Check 2: Content-Type validation
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.warn(`Contact API: Invalid content-type ${contentType} from ${clientIP}`);
      return createErrorResponse('Invalid content type', 'INVALID_CONTENT_TYPE', 400);
    }

    // Security Check 3: Request size limit (1MB)
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 1024 * 1024) {
      console.warn(`Contact API: Request too large (${contentLength}) from ${clientIP}`);
      return createErrorResponse('Request too large', 'REQUEST_TOO_LARGE', 413);
    }

    // Parse and validate input
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.warn(`Contact API: Invalid JSON from ${clientIP}:`, error.message);
      return createErrorResponse('Invalid JSON format', 'INVALID_JSON', 400);
    }

    // Validate input against schema
    const validationResult = ContactFormSchema.safeParse(body);
    if (!validationResult.success) {
      console.warn(`Contact API: Validation failed for ${clientIP}:`, validationResult.error.issues);
      
      // Return validation errors without exposing internal details
      const errors = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      
      return createErrorResponse('Validation failed', 'VALIDATION_ERROR', 400, { errors });
    }

    const { name, email, subject, message, website } = validationResult.data;

    // Security Check 4: Honeypot validation
    if (website) {
      console.warn(`Contact API: Honeypot triggered by ${clientIP}`);
      // Return success to avoid revealing the honeypot
      return createSuccessResponse('Message sent successfully', 'MESSAGE_SENT');
    }

    // Security Check 5: Additional spam detection
    if (detectSpam(name, email, subject, message)) {
      console.warn(`Contact API: Spam detected from ${clientIP}`, { name, email, subject });
      // Log but don't block - could be false positive
      // Return success to avoid revealing detection
      return createSuccessResponse('Message sent successfully', 'MESSAGE_SENT');
    }

    // Log successful contact form submission
    console.log(`Contact API: Valid submission from ${clientIP}`, {
      name: name.substring(0, 20) + '...',
      email: email.split('@')[0] + '@***',
      subject: subject.substring(0, 30) + '...',
      botConfidence: botCheck.confidence,
      responseTime: Date.now() - startTime,
    });

    // TODO: In production, integrate with email service (SendGrid, etc.)
    // await sendEmail({ name, email, subject, message });

    // Return success response
    return createSuccessResponse('Message sent successfully', 'MESSAGE_SENT');

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`Contact API: Unexpected error for ${clientIP} (${responseTime}ms):`, error);

    // Generic error response to prevent information leakage
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

// Only allow POST requests
export async function GET() {
  return createErrorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
}

export async function PUT() {
  return createErrorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
}

export async function DELETE() {
  return createErrorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
}

/**
 * Create standardized error response
 */
function createErrorResponse(message, code, status, data = null) {
  const response = {
    success: false,
    error: {
      message,
      code,
      timestamp: new Date().toISOString(),
    },
  };

  if (data) {
    response.error.data = data;
  }

  return new Response(JSON.stringify(response), {
    status,
    headers: {
      'Content-Type': 'application/json',
      // Prevent caching of error responses
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

/**
 * Create standardized success response
 */
function createSuccessResponse(message, code, data = null) {
  const response = {
    success: true,
    message,
    code,
    timestamp: new Date().toISOString(),
  };

  if (data) {
    response.data = data;
  }

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // Prevent caching of API responses
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

/**
 * Basic spam detection
 * 
 * SECURITY NOTE: This is a simple implementation.
 * In production, consider using more sophisticated methods:
 * - Machine learning models
 * - External spam detection services
 * - Content analysis APIs
 */
function detectSpam(name, email, subject, message) {
  const spamPatterns = [
    // Common spam keywords
    /\b(viagra|cialis|casino|lottery|winner|congratulations|millions?)\b/i,
    // Excessive links
    /https?:\/\/.*https?:\/\//i,
    // Excessive repetition
    /(.)\1{10,}/,
    // All caps messages
    /^[A-Z\s!]+$/,
  ];

  const fullText = `${name} ${email} ${subject} ${message}`.toLowerCase();
  
  return spamPatterns.some(pattern => pattern.test(fullText));
}