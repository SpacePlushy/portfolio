export async function POST({ request, locals }) {
  // BotID check is already done in middleware
  // Check if bot was detected
  if (locals.botCheck && locals.botCheck.status === 'likely_bot') {
    return new Response(JSON.stringify({ 
      error: 'Bot detected' 
    }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  try {
    // Parse the form data
    const data = await request.json();
    const { name, email, message } = data;

    // Validate the data
    if (!name || !email || !message) {
      return new Response(JSON.stringify({ 
        error: 'All fields are required' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Here you would normally send an email or save to a database
    // For now, we'll just log it and return success
    console.log('Contact form submission:', {
      name,
      email,
      message,
      botCheck: locals.botCheck
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Thank you for your message! I\'ll get back to you soon.' 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return new Response(JSON.stringify({ 
      error: 'An error occurred processing your request' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// Only allow POST requests
export async function GET() {
  return new Response('Method not allowed', { status: 405 });
}