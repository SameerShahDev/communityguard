import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Edge Runtime compatible Supabase client (no cookies)
export function createEdgeClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Service Role client for admin operations (bypasses RLS)
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not set')
  }
  
  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
