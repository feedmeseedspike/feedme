import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '../database.types'
import type { TypedSupabaseClient } from '../types'
import { useMemo } from 'react'

let client: TypedSupabaseClient | undefined

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
function useSupabaseBrowser() {
  return useMemo(createClient, [])
}

export default useSupabaseBrowser
