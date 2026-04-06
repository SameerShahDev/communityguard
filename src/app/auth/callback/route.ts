import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    // Exchange code for session using Supabase auth
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    // Call Supabase auth API directly for Edge compatibility
    const authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=authorization_code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({ code })
    })
    
    if (authRes.ok) {
      const authData = await authRes.json()
      const { access_token, user } = authData
      
      if (user) {
        // Sync user to database using edge client
        const { createEdgeClient } = await import('@/lib/supabase/edge')
        const edgeSupabase = createEdgeClient()
        
        const discord_id = user.user_metadata?.provider_id || user.user_metadata?.sub;
        
        await edgeSupabase
          .from('users')
          .upsert({
            id: user.id,
            email: user.email!,
            discord_id: discord_id,
            pro_days_left: 30
          }, { onConflict: 'email' });
        
        // Set auth cookie in response
        const response = NextResponse.redirect(`${origin}${next}`)
        response.cookies.set('sb-access-token', access_token, {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7 // 1 week
        })
        return response
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
