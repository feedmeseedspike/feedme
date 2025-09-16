// src/utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../database.types'
import { useMemo } from 'react'

let client: any | undefined

// Create a singleton client instance
export function createClient(): any {
  if (!client) {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
    }

    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    )
  }

  return client!
}

// Hook for React components
export function useSupabaseBrowser(): any {
  return useMemo(() => createClient(), [])
}

// Alternative hook name for consistency
export function useSupabase(): any {
  return useSupabaseBrowser()
}

// Default export
export default useSupabaseBrowser

// Named export for direct client access
export { createClient as getBrowserClient }