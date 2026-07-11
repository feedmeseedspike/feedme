import { NextResponse } from 'next/server';
import { zohoService } from '@/lib/zoho/zoho-service';

/**
 * POST /api/integrations/zoho/recommendations
 * Creates a product recommendation campaign for a segment.
 * 
 * Body: { campaignName, subject, htmlContent, listKey? }
 */
export async function POST(request: Request) {
  try {
    const { campaignName, subject, htmlContent, listKey } = await request.json();

    if (!campaignName || !subject || !htmlContent) {
      return NextResponse.json(
        { success: false, error: 'campaignName, subject, and htmlContent are required' },
        { status: 400 }
      );
    }

    const targetListKey = listKey || process.env.ZOHO_MAILING_LIST_KEY;
    if (!targetListKey) {
      return NextResponse.json(
        { success: false, error: 'No mailing list key provided' },
        { status: 500 }
      );
    }

    const result = await zohoService.createCampaign({
      campaignname: campaignName,
      from_email: process.env.ZOHO_FROM_EMAIL || 'orders.feedmeafrica@gmail.com',
      subject,
      content: htmlContent,
      list_details: JSON.stringify({ [targetListKey]: 'All Subscribers' }),
    });

    return NextResponse.json({
      success: true,
      message: 'Recommendation campaign created',
      campaign: result,
    });
  } catch (error: any) {
    console.error('Zoho recommendation campaign error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
