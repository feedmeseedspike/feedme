import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const location = requestUrl.searchParams.get('location') || 'us'; // result of accounts.zoho.com implies region often
  const accountsUrl = location === 'eu' ? 'https://accounts.zoho.eu' : 'https://accounts.zoho.com';

  if (!code) {
    const error = requestUrl.searchParams.get('error');
    return NextResponse.json({ error: error || 'No code provided' }, { status: 400 });
  }

  try {
    // 1. You need these environment variables set
    const clientId = process.env.ZOHO_CLIENT_ID;
    const clientSecret = process.env.ZOHO_CLIENT_SECRET;
    const redirectUri = `${requestUrl.origin}/api/integrations/zoho/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ 
        error: 'Missing configuration', 
        message: 'ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET must be set in .env' 
      }, { status: 500 });
    }

    // 2. Exchange code for tokens
    const tokenResponse = await fetch(`${accountsUrl}/oauth/v2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const data = await tokenResponse.json();

    if (data.error) {
      return NextResponse.json({ error: 'Token exchange failed', details: data }, { status: 400 });
    }

    // 3. Store tokens (access_token, refresh_token, etc.)
    // TODO: Save data.access_token and data.refresh_token to your database (e.g., in an 'integrations' table)
    
    // For now, returning them JSON so you can see it works
    return NextResponse.json({ 
      success: true, 
      message: 'Zoho tokens received', 
      tokens: data 
    });

  } catch (error) {
    console.error('Zoho Auth Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}
