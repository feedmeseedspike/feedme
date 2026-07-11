import { NextResponse } from 'next/server';
import { zohoService } from '@/lib/zoho/zoho-service';

/**
 * POST /api/integrations/zoho/review-request
 * Logs a review request email event for a delivered order.
 * 
 * Body: { email, orderId, productNames }
 */
export async function POST(request: Request) {
  try {
    const { email, orderId, productNames } = await request.json();

    if (!email || !orderId) {
      return NextResponse.json(
        { success: false, error: 'email and orderId are required' },
        { status: 400 }
      );
    }

    await zohoService.logReviewRequest(
      email,
      orderId,
      productNames || []
    );

    return NextResponse.json({
      success: true,
      message: `Review request logged for order ${orderId}`,
    });
  } catch (error: any) {
    console.error('Zoho review request error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to log review request' },
      { status: 500 }
    );
  }
}
