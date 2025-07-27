export async function onRequest(context, next) {
  const { url, request } = context;
  
  // Handle Chrome DevTools requests cleanly
  if (url.pathname === '/.well-known/appspecific/com.chrome.devtools.json') {
    // Return 204 No Content to prevent 404 logs
    return new Response(null, { status: 204 });
  }
  
  // BotID protection for API routes
  if (url.pathname.startsWith('/api/')) {
    try {
      const { checkBotId } = await import('botid');
      const result = await checkBotId(request);
      
      if (result.status === 'likely_bot') {
        return new Response('Bot protection: Access denied', { 
          status: 403,
          headers: {
            'Content-Type': 'text/plain'
          }
        });
      }
      
      // Add bot check result to locals for use in API routes
      context.locals.botCheck = result;
    } catch (error) {
      console.error('BotID check failed:', error);
      // Continue on error but log it
    }
  }
  
  // Continue with normal request handling
  return next();
}