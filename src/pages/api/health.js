/**
 * Health Check API Endpoint
 * 
 * Provides system health status without exposing sensitive information.
 * 
 * SECURITY CONSIDERATIONS:
 * - No authentication required (public endpoint)
 * - Limited information exposure
 * - No internal system details
 * - Rate limiting recommended
 */

export async function GET({ request, locals }) {
  const startTime = Date.now();
  const clientIP = locals?.clientIP || 'unknown';

  try {
    // Basic health check data (safe to expose)
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? Math.floor(process.uptime()) : null,
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };

    // Optional: Add bot protection status if available
    if (locals?.botCheck) {
      healthData.security = {
        botProtectionActive: true,
        requestVerified: locals.botCheck.status === 'human',
      };
    }

    const responseTime = Date.now() - startTime;
    
    // Log health check (minimal logging for this endpoint)
    console.log(`Health check from ${clientIP} (${responseTime}ms)`);

    return new Response(JSON.stringify(healthData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Cache for 30 seconds to reduce load
        'Cache-Control': 'public, max-age=30',
      },
    });

  } catch (error) {
    console.error(`Health check error for ${clientIP}:`, error);

    // Return minimal error information
    return new Response(
      JSON.stringify({
        status: 'error',
        timestamp: new Date().toISOString(),
        message: 'Health check failed',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      }
    );
  }
}

// Only allow GET requests
export async function POST() {
  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { 
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

export async function PUT() {
  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { 
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

export async function DELETE() {
  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { 
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}