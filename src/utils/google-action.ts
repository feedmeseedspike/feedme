'use server'

import { redirect } from 'next/navigation';
import { createClient } from '../utils/supabase/server';

type Provider = 'google' | 'github'

const getGoogleAction = (provider: Provider) => async () => {
  const supabase = await createClient();

  const auth_callback_url = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`

  const {data, error} = await supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: auth_callback_url,
    },
  })

  console.log(data)

  if(error) {
    console.log(error)
  }

  redirect(data.url)
}


const signinWithGoogle = getGoogleAction("google")

export { signinWithGoogle }
