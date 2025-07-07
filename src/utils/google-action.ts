'use server'

import { redirect } from 'next/navigation';
import { createClient } from '../utils/supabase/server';

type Provider = 'google' | 'github'

const getGoogleAction = (provider: Provider) => async (referralCode?: string) => {
  const supabase = await createClient();

  let auth_callback_url = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;

  if (referralCode) {
    auth_callback_url += `?referral_code=${encodeURIComponent(referralCode)}`;
  }

  const {data, error} = await supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: auth_callback_url,
    },
  })

  if(error) {
    throw error; // Or redirect to an error page
  }

  if (!data.url) {
    throw new Error("OAuth sign-in did not return a redirect URL.");
  }

  redirect(data.url)
}


const signinWithGoogle = getGoogleAction("google")

export { signinWithGoogle }
