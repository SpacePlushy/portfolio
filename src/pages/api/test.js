// Test API endpoint to verify BotID protection is working
export async function GET({ request, locals }) {
  // BotID check is handled in middleware and stored in locals.botCheck
  const botCheck = locals.botCheck;
  
  return new Response(JSON.stringify({
    success: true,
    message: 'BotID protection is working',
    timestamp: new Date().toISOString(),
    botCheck: botCheck ? {
      status: botCheck.status,
      // Don't expose full error details for security
      hasError: botCheck.error ? true : false
    } : null,
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
    }
  });
}

export async function POST({ request, locals }) {
  // BotID check is handled in middleware and stored in locals.botCheck
  const botCheck = locals.botCheck;
  
  try {
    const body = await request.json();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'POST request processed successfully',
      timestamp: new Date().toISOString(),
      receivedData: body,
      botCheck: botCheck ? {
        status: botCheck.status,
        hasError: botCheck.error ? true : false
      } : null
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST',
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid JSON in request body',
      timestamp: new Date().toISOString(),
      botCheck: botCheck ? {
        status: botCheck.status,
        hasError: botCheck.error ? true : false
      } : null
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}