import { checkBotId } from 'botid/server';

export async function onRequest(context, next) {
  // Handle Chrome DevTools requests cleanly
  if (context.url.pathname === '/.well-known/appspecific/com.chrome.devtools.json') {
    // Return 204 No Content to prevent 404 logs
    return new Response(null, { status: 204 });
  }

  // Apply bot protection to API routes
  if (context.url.pathname.startsWith('/api/')) {
    try {
      // Check for bot using botid package
      const botCheck = await checkBotId();

      // Store bot check result in locals for API handlers to use
      context.locals.botCheck = botCheck;

      // Optional: Block likely bots (uncomment if desired)
      // if (botCheck.isBot && !botCheck.isGoodBot) {
      //   return new Response('Forbidden', {
      //     status: 403,
      //     headers: { 'Content-Type': 'text/plain' }
      //   });
      // }
    } catch (error) {
      // Log error but don't block request on bot check failure
      console.warn('Bot check failed:', error);
      context.locals.botCheck = { isHuman: true, isBot: false, error: error.message };
    }
  }

  // Continue with normal request handling
  return next();
}
