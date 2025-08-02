/**
 * Readiness check endpoint - simple check to verify the server is ready to accept requests
 * This is different from health check - readiness only checks if the server is up and running
 */

const startupTime = Date.now();

export async function GET() {
  const now = Date.now();
  const uptime = Math.floor((now - startupTime) / 1000); // uptime in seconds

  const response = {
    ready: true,
    uptime,
    timestamp: new Date().toISOString(),
    message: 'Server is ready to accept requests'
  };

  return new Response(JSON.stringify(response, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}