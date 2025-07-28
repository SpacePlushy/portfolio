import { checkBotId } from 'botid';

export async function onRequest(context, next) {
  // Handle Chrome DevTools requests cleanly
  if (context.url.pathname === '/.well-known/appspecific/com.chrome.devtools.json') {
    // Return 204 No Content to prevent 404 logs
    return new Response(null, { status: 204 });
  }
  
  // Skip BotID check for static assets and non-API routes
  if (context.url.pathname.startsWith('/api/')) {
    try {
      // Run BotID check for API routes
      const botCheckResult = await checkBotId({
        request: context.request,
      });
      
      // Store bot check result in locals for API routes to access
      context.locals.botCheck = botCheckResult;
      
      // If likely bot and not explicitly allowed, block the request
      if (botCheckResult.status === 'likely_bot') {
        return new Response('Forbidden', { 
          status: 403,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    } catch (error) {
      // Log error but don't block request - fail open for availability
      console.error('BotID check failed:', error);
      context.locals.botCheck = { status: 'error', error: error.message };
    }
  }
  
  // Continue with normal request handling
  return next();
}