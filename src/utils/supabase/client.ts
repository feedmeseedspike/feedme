// src/utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '../database.types'
import type { TypedSupabaseClient } from '../types'
import { useMemo } from 'react'

let client: TypedSupabaseClient | undefined

// Create a singleton client instance
export function createClient(): TypedSupabaseClient {
  if (!client) {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
    }

    client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }

  return client
}

// Hook for React components
export function useSupabaseBrowser(): TypedSupabaseClient {
  return useMemo(() => createClient(), [])
}

// Alternative hook name for consistency
export function useSupabase(): TypedSupabaseClient {
  return useSupabaseBrowser()
}

// Default export
export default useSupabaseBrowser

// Named export for direct client access
export { createClient as getBrowserClient }