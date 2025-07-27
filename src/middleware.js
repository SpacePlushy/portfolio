export function onRequest(context, next) {
  // Handle Chrome DevTools requests cleanly
  if (context.url.pathname === '/.well-known/appspecific/com.chrome.devtools.json') {
    // Return 204 No Content to prevent 404 logs
    return new Response(null, { status: 204 });
  }
  
  // Continue with normal request handling
  return next();
}