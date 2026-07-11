import { NextResponse } from 'next/server';
import { zohoTokenManager } from '@/lib/zoho/token-manager';

/**
 * POST /api/integrations/zoho/disconnect
 * Revokes tokens and removes the Zoho integration.
 */
export async function POST() {
  try {
    await zohoTokenManager.revokeTokens();
    return NextResponse.json({ success: true, message: 'Zoho integration disconnected' });
  } catch (error) {
    console.error('Zoho disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect', details: String(error) },
      { status: 500 }
    );
  }
}
