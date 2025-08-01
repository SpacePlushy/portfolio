export async function onRequest(context, next) {
  // Handle Chrome DevTools requests cleanly
  if (context.url.pathname === '/.well-known/appspecific/com.chrome.devtools.json') {
    // Return 204 No Content to prevent 404 logs
    return new Response(null, { status: 204 });
  }

  // Apply basic bot protection to API routes
  if (context.url.pathname.startsWith('/api/')) {
    // Basic bot detection using user agent
    const userAgent = context.request.headers.get('user-agent') || '';
    const isBot = /bot|crawler|spider|scraper|wget|curl/i.test(userAgent);
    
    // Store bot check result in locals for API handlers to use
    context.locals.botCheck = {
      status: isBot ? 'likely_bot' : 'likely_human',
      userAgent
    };

    // Optional: Block likely bots (uncomment if desired)
    // if (isBot) {
    //   return new Response('Forbidden', {
    //     status: 403,
    //     headers: { 'Content-Type': 'text/plain' }
    //   });
    // }
  }

  // Continue with normal request handling
  return next();
}
