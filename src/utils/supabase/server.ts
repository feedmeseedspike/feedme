// src/utils/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// For Server Components (read-only, cannot modify cookies)
export async function createServerComponentClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // Do nothing - Server Components cannot modify cookies
        },
      },
    }
  )
}

// For Server Actions and Route Handlers (can modify cookies)
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            // Cannot modify cookies in Server Component context
          }
        },
      },
    }
  )
}

// Legacy function name compatibility (if you were using this)
export const createServerSupabaseClient = createServerComponentClient

// Alternative: Service role client for admin operations
export function createServiceRoleClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!, // Note: Service role key
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // Service role doesn't need cookies
        },
      },
    }
  )
}