import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Edge Runtime compatible Supabase client (no cookies)
export function createEdgeClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
