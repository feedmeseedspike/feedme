'use server'

import { redirect } from 'next/navigation';
import { createClient } from '../utils/supabase/server';

type Provider = 'google' | 'github'

const getGoogleAction = (provider: Provider) => async (callbackUrl?: string, referralCode?: string) => {
  const supabase = await createClient();

  let auth_callback_url = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;

  const params = new URLSearchParams();
  if (callbackUrl) params.set('callbackUrl', callbackUrl);
  if (referralCode) params.set('referral_code', referralCode);
  
  if (params.toString()) {
    auth_callback_url += `?${params.toString()}`;
  }

  const {data, error} = await supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: auth_callback_url,
    },
  })

  if(error) {
    throw error;
  }

  if (!data.url) {
    throw new Error("OAuth sign-in did not return a redirect URL.");
  }

  redirect(data.url)
}


const signinWithGoogle = getGoogleAction("google")

export { signinWithGoogle }
