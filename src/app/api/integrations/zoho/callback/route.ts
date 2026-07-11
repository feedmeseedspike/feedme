import { NextRequest, NextResponse } from 'next/server';
import { zohoTokenManager } from '@/lib/zoho/token-manager';
import { ZOHO_TOKEN_URL } from '@/lib/zoho/constants';
import type { ZohoTokenResponse } from '@/lib/zoho/types';

/**
 * GET /api/integrations/zoho/callback
 * Receives the authorization code from Zoho, exchanges it for tokens,
 * and persists them in Supabase.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const location = requestUrl.searchParams.get('location') || 'us';
  const accountsUrl =
    location === 'eu'
      ? 'https://accounts.zoho.eu'
      : location === 'in'
      ? 'https://accounts.zoho.in'
      : 'https://accounts.zoho.com';

  if (!code) {
    const error = requestUrl.searchParams.get('error');
    return NextResponse.json(
      { error: error || 'No authorization code provided' },
      { status: 400 }
    );
  }

  try {
    const clientId = process.env.ZOHO_CLIENT_ID;
    const clientSecret = process.env.ZOHO_CLIENT_SECRET;
    const redirectUri = process.env.ZOHO_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        {
          error: 'Missing configuration',
          message:
            'ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, and ZOHO_REDIRECT_URI must be set in .env',
        },
        { status: 500 }
      );
    }

    // Exchange authorization code for tokens
    const tokenUrl = `${accountsUrl}/oauth/v2/token`;
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const data: ZohoTokenResponse = await tokenResponse.json();

    if (data.error) {
      return NextResponse.json(
        { error: 'Token exchange failed', details: data },
        { status: 400 }
      );
    }

    if (!data.refresh_token) {
      return NextResponse.json(
        {
          error: 'No refresh token received',
          message:
            'Make sure access_type=offline is set and you have not already authorized. Try revoking access at accounts.zoho.com and retry.',
          details: data,
        },
        { status: 400 }
      );
    }

    // Persist tokens to Supabase
    await zohoTokenManager.saveTokens(data, accountsUrl);

    // Redirect to admin dashboard with success indicator
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin;
    return NextResponse.redirect(
      `${siteUrl}/admin?zoho_connected=true`
    );
  } catch (error) {
    console.error('Zoho Auth Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: String(error) },
      { status: 500 }
    );
  }
}
