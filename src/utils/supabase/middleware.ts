import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet:any) => {
          cookiesToSet.forEach(({ name, value, options }:any) =>
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  let user = null
  try {
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser()
    if (error) throw error
    user = supabaseUser
  } catch (error) {
    // Ignore refresh token errors or return null
  }

  return { response, user }
}