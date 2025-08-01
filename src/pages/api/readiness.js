// Simple readiness probe for faster health checks during startup
let startupTime = Date.now();

export function GET() {
  const uptime = (Date.now() - startupTime) / 1000;
  
  // Simple readiness check - just verify the server can respond
  return new Response(JSON.stringify({
    ready: true,
    uptime: Math.round(uptime),
    timestamp: new Date().toISOString(),
    message: 'Server is ready to accept requests'
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}