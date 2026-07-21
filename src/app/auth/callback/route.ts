// /app/auth/callback/route.ts
import { createClient } from '@/utils/supabase/server';
import { users } from '@/utils/users';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const type = requestUrl.searchParams.get('type');
    const callbackUrl = requestUrl.searchParams.get('callbackUrl') || '/';
    const referralCode = requestUrl.searchParams.get('referral_code');

    const supabase = await createClient();

    // Handle different auth flow types
    if (type === 'recovery') {
      if (!code) {
        console.error('No code provided for password recovery');
        const errorUrl = new URL('/auth/forgot-password', requestUrl.origin);
        errorUrl.searchParams.set('error', 'Invalid reset link');
        return NextResponse.redirect(errorUrl);
      }

      const resetUrl = new URL('/auth/reset-password', requestUrl.origin);
      resetUrl.searchParams.set('code', code);
      resetUrl.searchParams.set('type', 'recovery');
      
      return NextResponse.redirect(resetUrl);
    }

    // Handle email confirmation flow
    if (type === 'email_confirmation' || type === 'signup') {
      if (!code) {
        console.error('No code provided for email confirmation');
        const errorUrl = new URL('/auth/auth-error', requestUrl.origin);
        errorUrl.searchParams.set('error', 'Invalid confirmation link');
        return NextResponse.redirect(errorUrl);
      }

      try {
        const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (exchangeError) {
          console.error('Email confirmation exchange error:', exchangeError);
          const errorUrl = new URL('/auth/auth-error', requestUrl.origin);
          errorUrl.searchParams.set('error', 'Failed to confirm email');
          return NextResponse.redirect(errorUrl);
        }

        const successUrl = new URL('/auth/email-confirmed', requestUrl.origin);
        if (callbackUrl !== '/') {
          successUrl.searchParams.set('callbackUrl', callbackUrl);
        }
        
        return NextResponse.redirect(successUrl);
      } catch (error) {
        console.error('Email confirmation error:', error);
        const errorUrl = new URL('/auth/auth-error', requestUrl.origin);
        errorUrl.searchParams.set('error', 'Email confirmation failed');
        return NextResponse.redirect(errorUrl);
      }
    }

    // Standard OAuth/sign-in flow
    const { data: { user: existingUser }, error: existingUserError } = await supabase.auth.getUser();

    if (existingUserError) {
      console.error('Error checking existing user in callback:', existingUserError);
    }

    if (existingUser && !code) {
      if (referralCode && existingUser.id) {
        try {
          const response = await fetch(`${requestUrl.origin}/api/referral`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              referrerEmail: referralCode, 
              referredUserId: existingUser.id 
            }),
          });
          
          if (!response.ok) {
            console.error("Failed to apply referral for existing user after OAuth callback:", await response.json());
          }
        } catch (error) {
          console.error("Error applying referral for existing user:", error);
        }
      }
      
      return NextResponse.redirect(new URL(callbackUrl, requestUrl.origin));
    }

    if (!code) {
      console.error('No code provided in callback for new sign-in.');
      const errorUrl = new URL('/auth/auth-error', requestUrl.origin);
      errorUrl.searchParams.set('error', 'No authorization code provided');
      return NextResponse.redirect(errorUrl);
    }

    const { data: exchangeCodeData, error: exchangeCodeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeCodeError) {
      console.error('Auth error during code exchange:', exchangeCodeError);
      
      if (exchangeCodeError.message?.includes('expired')) {
        const errorUrl = new URL('/auth/auth-error', requestUrl.origin);
        errorUrl.searchParams.set('error', 'Authorization code expired. Please try signing in again.');
        return NextResponse.redirect(errorUrl);
      }
      
      if (exchangeCodeError.message?.includes('invalid')) {
        const errorUrl = new URL('/auth/auth-error', requestUrl.origin);
        errorUrl.searchParams.set('error', 'Invalid authorization code. Please try signing in again.');
        return NextResponse.redirect(errorUrl);
      }
      
      const errorUrl = new URL('/auth/auth-error', requestUrl.origin);
      errorUrl.searchParams.set('error', 'Authentication failed. Please try again.');
      return NextResponse.redirect(errorUrl);
    }

    const { data: { user: authenticatedUser }, error: getUserError } = await supabase.auth.getUser();

    if (getUserError) {
      console.error('Error getting authenticated user after exchange:', getUserError);
      const errorUrl = new URL('/auth/auth-error', requestUrl.origin);
      errorUrl.searchParams.set('error', 'Failed to authenticate user');
      return NextResponse.redirect(errorUrl);
    }

    if (!authenticatedUser) {
      console.error('No authenticated user found after successful code exchange');
      const errorUrl = new URL('/auth/auth-error', requestUrl.origin);
      errorUrl.searchParams.set('error', 'Authentication incomplete');
      return NextResponse.redirect(errorUrl);
    }

    // Capture user details after successful OAuth and authentication
    try {
      const existingProfile = await users.getUser(authenticatedUser.id).catch(() => null);
      const isNewUserSignup = !existingProfile;

      await users.captureUserDetails(authenticatedUser);

      // Sync new Google signups to Zoho with their Google first name
      if (isNewUserSignup && authenticatedUser.email) {
        const fullGoogleName = 
          authenticatedUser.user_metadata?.full_name || 
          authenticatedUser.user_metadata?.name || 
          authenticatedUser.user_metadata?.given_name || 
          authenticatedUser.email.split("@")[0] || 
          "";

        try {
          const { zohoService } = await import('@/lib/zoho/zoho-service');
          const listKey = process.env.ZOHO_MAILING_LIST_KEY;
          if (listKey) {
            const names = fullGoogleName.trim().split(" ");
            const firstName = names[0] || fullGoogleName.trim();
            const lastName = names.slice(1).join(" ") || "";

            await zohoService.subscribeContact(listKey, {
              "Contact Email": authenticatedUser.email,
              "First Name": firstName,
              "Last Name": lastName,
            });
            console.log(`✅ Synced new Google OAuth user ${authenticatedUser.email} (${firstName}) to Zoho`);
          }
        } catch (zohoErr) {
          console.warn('⚠️ Could not sync Google OAuth user to Zoho:', zohoErr);
        }
      }
      
      if (referralCode && authenticatedUser.id) {
        try {
          const response = await fetch(`${requestUrl.origin}/api/referral`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              referrerEmail: referralCode, 
              referredUserId: authenticatedUser.id 
            }),
          });
          
          if (!response.ok) {
            console.error("Failed to apply referral after OAuth callback:", await response.json());
          }
        } catch (error) {
          console.error("Error applying referral:", error);
        }
      }
    } catch (error) {
      console.error('Error capturing user details:', error);
    }

    // Determine final redirect URL
    let finalRedirectUrl: URL;
    
    // For new signups, you might want to redirect to onboarding
    const isNewUser = exchangeCodeData?.user?.created_at === exchangeCodeData?.user?.updated_at;
    
    if (isNewUser && !callbackUrl.includes('account')) {
      // New user - redirect to onboarding or welcome page
      finalRedirectUrl = new URL('/onboarding', requestUrl.origin);
    } else {
      // Existing user or specific callback requested
      finalRedirectUrl = new URL(callbackUrl, requestUrl.origin);
    }
    
    // Preserve referral code in the final redirect if present
    if (referralCode) {
      finalRedirectUrl.searchParams.set('referral_code', referralCode);
    }
    
    // Add success parameter to indicate successful authentication
    finalRedirectUrl.searchParams.set('auth_success', 'true');
    
    return NextResponse.redirect(finalRedirectUrl);

  } catch (error) {
    console.error('Unexpected callback error:', error);
    
    // Create a detailed error URL
    const errorUrl = new URL('/auth/auth-error', request.url);
    errorUrl.searchParams.set('error', 'An unexpected error occurred during authentication');
    
    // In development, you might want to include more error details
    if (process.env.NODE_ENV === 'development') {
      errorUrl.searchParams.set('details', error instanceof Error ? error.message : 'Unknown error');
    }

    return NextResponse.redirect(errorUrl);
  }
}