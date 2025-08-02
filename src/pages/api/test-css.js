export function GET() {
  return new Response(JSON.stringify({
    message: "CSS test endpoint",
    cssPath: "/_astro/*.css",
    note: "Check if CSS files are being served from the /_astro/ directory"
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}