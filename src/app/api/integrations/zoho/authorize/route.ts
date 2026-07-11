import { NextRequest, NextResponse } from 'next/server';
import { ZOHO_AUTH_URL, ZOHO_SCOPES } from '@/lib/zoho/constants';

/**
 * GET /api/integrations/zoho/authorize
 * Redirects the admin to Zoho's OAuth consent page.
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const redirectUri = process.env.ZOHO_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'ZOHO_CLIENT_ID and ZOHO_REDIRECT_URI must be set in .env' },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    scope: ZOHO_SCOPES,
    client_id: clientId,
    response_type: 'code',
    access_type: 'offline', // ensures we get a refresh_token
    redirect_uri: redirectUri,
    prompt: 'consent',
  });

  const authUrl = `${ZOHO_AUTH_URL}?${params.toString()}`;

  return NextResponse.redirect(authUrl);
}
