// /app/auth/callback/route.ts
import { createClient } from '@/utils/supabase/server';
import { users } from '@/utils/users';
import { NextRequest, NextResponse } from 'next/server';

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
      // This is a password reset flow
      if (!code) {
        console.error('No code provided for password recovery');
        const errorUrl = new URL('/auth/forgot-password', requestUrl.origin);
        errorUrl.searchParams.set('error', 'Invalid reset link');
        return NextResponse.redirect(errorUrl);
      }

      // Redirect to reset password page with the code
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

        // Email confirmed successfully, redirect to success page or dashboard
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
    // Check if user is already authenticated
    const { data: { user: existingUser }, error: existingUserError } = await supabase.auth.getUser();

    if (existingUserError) {
      console.error('Error checking existing user in callback:', existingUserError);
      // Continue, as this might be a fresh sign-in attempt
    }

    if (existingUser && !code) {
      // User is already logged in and no new code to process
      
      // Attempt to apply referral for existing user if present in URL
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

    // If no existing user or we have a code, proceed with code exchange (for new sign-ins or re-authentication)
    if (!code) {
      console.error('No code provided in callback for new sign-in.');
      const errorUrl = new URL('/auth/auth-error', requestUrl.origin);
      errorUrl.searchParams.set('error', 'No authorization code provided');
      return NextResponse.redirect(errorUrl);
    }

    // Exchange the code for a session
    const { data: exchangeCodeData, error: exchangeCodeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeCodeError) {
      console.error('Auth error during code exchange:', exchangeCodeError);
      
      // Handle specific error types
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
      
      // Generic error
      const errorUrl = new URL('/auth/auth-error', requestUrl.origin);
      errorUrl.searchParams.set('error', 'Authentication failed. Please try again.');
      return NextResponse.redirect(errorUrl);
    }

    // Fetch authenticated user after session exchange for security
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
      await users.captureUserDetails(authenticatedUser);
      
      // If there's a referral code from the original signup URL, apply it
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
          } else {
            console.log("Referral applied successfully after OAuth callback.");
          }
        } catch (error) {
          console.error("Error applying referral:", error);
          // Don't throw here - we still want to complete the auth flow
        }
      }
    } catch (error) {
      console.error('Error capturing user details:', error);
      // Don't throw here - we still want to complete the auth flow
      // But maybe log this for monitoring
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