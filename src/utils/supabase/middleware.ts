import { type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function updateSession(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
        }
      }
    }
  )
  try {
    await supabase.auth.getUser()
  } catch (err: any) {
    if (
      err?.status === 400 &&
      (err?.code === 'refresh_token_not_found' ||
        err?.message?.toLowerCase().includes('refresh token not found'))
    ) {
      // Ignore
    } else {
      console.error('Supabase auth error in middleware:', err)
    }
  }
}