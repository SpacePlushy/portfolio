import { checkBotId } from 'botid/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Check if the request is from a bot
  const verification = await checkBotId();

  if (verification.isBot) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }

  try {
    // Parse the form data
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate the input
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // TODO: Implement actual email sending logic here
    // For now, we'll just return success
    console.log('Contact form submission:', { name, email, subject, message });

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully!'
    });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}