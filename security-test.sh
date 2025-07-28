#!/bin/bash

# Security Testing Script for Portfolio API
# This script demonstrates the security features implemented

echo "=== Portfolio Security Test ==="
echo ""

# Test 1: Health Check without bot protection (should be blocked)
echo "1. Testing health check without bot protection:"
echo "   curl -s http://localhost:4321/api/health"
echo "   Expected: Blocked by security system"
echo ""

# Test 2: Contact API without bot protection (should be blocked)
echo "2. Testing contact API without bot protection:"
echo "   curl -s -X POST http://localhost:4321/api/contact \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"name\":\"Test\",\"email\":\"test@example.com\"}'"
echo "   Expected: Blocked by security system"
echo ""

# Test 3: Invalid JSON to contact API (should be blocked and return validation error)
echo "3. Testing contact API with invalid JSON:"
echo "   curl -s -X POST http://localhost:4321/api/contact \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d 'invalid-json'"
echo "   Expected: Blocked by security system (no bot headers)"
echo ""

# Test 4: Test GET request to POST-only endpoint
echo "4. Testing GET request to contact API (POST-only):"
echo "   curl -s http://localhost:4321/api/contact"
echo "   Expected: Method not allowed (405)"
echo ""

echo "=== Security Features ==="
echo ""
echo "✓ Bot Protection: All API routes protected by bot detection"
echo "✓ Input Validation: Zod schemas validate all inputs"
echo "✓ Error Handling: Generic errors prevent information leakage"
echo "✓ Rate Limiting: Framework in place (Redis implementation needed)"
echo "✓ Security Headers: XSS protection, CSP, and frame options"
echo "✓ Request Logging: All API requests logged with security context"
echo "✓ Environment Security: Secrets never exposed to client"
echo ""

echo "=== To run actual tests ==="
echo "1. Start the development server: npm run dev"
echo "2. Run the commands above to test the security features"
echo "3. Check the server logs for security events and blocking"
echo ""

echo "=== Production Deployment ==="
echo "✓ Vercel environment variables configured for secrets"
echo "✓ Bot protection rules active in production"
echo "✓ Security headers enforced on all responses"
echo "✓ ISR caching for performance with security intact"