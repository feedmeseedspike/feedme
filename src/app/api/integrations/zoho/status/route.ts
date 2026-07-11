import { NextResponse } from 'next/server';
import { zohoTokenManager } from '@/lib/zoho/token-manager';
import { zohoService } from '@/lib/zoho/zoho-service';

/**
 * GET /api/integrations/zoho/status
 * Returns the current connection status and mailing list info.
 */
export async function GET() {
  try {
    const connected = await zohoTokenManager.isConnected();

    if (!connected) {
      return NextResponse.json({ connected: false, lists: [] });
    }

    // Try fetching mailing lists to verify the token actually works
    let lists: any[] = [];
    try {
      lists = await zohoService.getMailingLists();
    } catch (err) {
      console.warn('Connected but failed to fetch lists:', err);
    }

    return NextResponse.json({ connected: true, lists });
  } catch (error) {
    console.error('Zoho status check error:', error);
    return NextResponse.json(
      { connected: false, error: String(error) },
      { status: 500 }
    );
  }
}
