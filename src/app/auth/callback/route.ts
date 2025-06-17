import { createClient } from '../../../utils/supabase/server';
import { users } from '../../../utils/users';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const callbackUrl = requestUrl.searchParams.get('callbackUrl') || '/';
    const referralCode = requestUrl.searchParams.get('referral_code');

    const supabase = await createClient();

    // Check if user is already authenticated
    const { data: { user: existingUser }, error: existingUserError } = await supabase.auth.getUser();

    if (existingUserError) {
      console.error('Error checking existing user in callback:', existingUserError);
      // Continue, as this might be a fresh sign-in attempt
    }

    if (existingUser) {
      // User is already logged in, redirect to account dashboard or similar
      console.log('User already logged in, redirecting to account after referral check.');
      // Attempt to apply referral for existing user if present in URL
      if (referralCode && existingUser.id) {
        try {
          const response = await fetch(`${requestUrl.origin}/api/referral`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ referrerEmail: referralCode, referredUserId: existingUser.id }),
          });
          if (!response.ok) {
            console.error("Failed to apply referral for existing user after OAuth callback:", await response.json());
          } else {
            console.log("Referral applied successfully for existing user after OAuth callback.");
          }
        } catch (error) {
          console.error("Error applying referral for existing user:", error);
        }
      }
      // Always redirect existing users to a main authenticated page
      return NextResponse.redirect(new URL('/account', requestUrl.origin));
    }

    // If no existing user, proceed with code exchange (for new sign-ins or re-authentication)
    if (!code) {
      console.error('No code provided in callback for new sign-in.');
      throw new Error('No code provided');
    }

    const { data: exchangeCodeData, error: exchangeCodeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeCodeError) {
      console.error('Auth error during code exchange:', exchangeCodeError);
      throw exchangeCodeError;
    }

    // Fetch authenticated user after session exchange for security
    const { data: { user: authenticatedUser }, error: getUserError } = await supabase.auth.getUser();

    if (getUserError) {
      console.error('Error getting authenticated user after exchange:', getUserError);
      throw getUserError;
    }

    // Capture user details after successful OAuth and authentication
    if (authenticatedUser) {
      try {
        await users.captureUserDetails(authenticatedUser);

        // If there's a referral code from the original signup URL, apply it
        if (referralCode && authenticatedUser.id) {
          const response = await fetch(`${requestUrl.origin}/api/referral`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ referrerEmail: referralCode, referredUserId: authenticatedUser.id }),
          });
          if (!response.ok) {
            console.error("Failed to apply referral after OAuth callback:", await response.json());
          } else {
            console.log("Referral applied successfully after OAuth callback.");
          }
        }

      } catch (error) {
        console.error('Error capturing user details or applying referral:', error);
        // Don't throw here - we still want to complete the auth flow
      }
    }

    // Redirect to the intended page, preserving callbackUrl and referralCode
    let finalRedirectUrl = new URL(callbackUrl, requestUrl.origin);
    if (referralCode) {
      finalRedirectUrl.searchParams.set('referral_code', referralCode);
    }
    
    return NextResponse.redirect(finalRedirectUrl);
  } catch (error) {
    console.error('Callback error:', error);
    // Add error to the URL so we can display it
    const errorUrl = new URL('/auth/auth-error', request.url);
    errorUrl.searchParams.set('error', 'Failed to sign in');
    return NextResponse.redirect(errorUrl);
  }
}
