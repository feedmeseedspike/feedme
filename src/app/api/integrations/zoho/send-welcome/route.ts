import { NextResponse } from 'next/server';
import { zohoService } from '@/lib/zoho/zoho-service';

/**
 * POST /api/integrations/zoho/send-welcome
 * Subscribes a new customer and logs the welcome event.
 * 
 * Body: { email, firstName, lastName?, discountCode, discountPercentage }
 */
export async function POST(request: Request) {
  try {
    const { email, firstName, lastName, discountCode, discountPercentage } =
      await request.json();

    if (!email || !firstName) {
      return NextResponse.json(
        { success: false, error: 'email and firstName are required' },
        { status: 400 }
      );
    }

    const listKey = process.env.ZOHO_MAILING_LIST_KEY;
    if (!listKey) {
      return NextResponse.json(
        { success: false, error: 'ZOHO_MAILING_LIST_KEY not configured' },
        { status: 500 }
      );
    }

    // Subscribe contact + log welcome event
    await zohoService.sendWelcomeEmail(
      listKey,
      email,
      firstName,
      discountCode || 'WELCOME10',
      discountPercentage || 10
    );

    return NextResponse.json({
      success: true,
      message: `Welcome email flow triggered for ${email}`,
    });
  } catch (error: any) {
    console.error('Zoho welcome email error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to send welcome email' },
      { status: 500 }
    );
  }
}
