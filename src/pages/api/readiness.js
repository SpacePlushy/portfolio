// Ultra-fast health check endpoint for Digital Ocean
// Responds immediately without any blocking operations
export async function GET() {
  // Return success immediately - no dependency checks
  return new Response('OK', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Response-Time': '1ms'
    }
  });
}