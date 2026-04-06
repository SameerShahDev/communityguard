import { NextResponse } from 'next/server'

export const runtime = 'edge';

// Production URL
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://communityguard.pages.dev';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    try {
      // Exchange code for session using Supabase auth
      const authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=authorization_code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({ 
          code,
          redirect_uri: `${SITE_URL}/auth/callback`
        })
      })
      
      if (authRes.ok) {
        const authData = await authRes.json()
        const { access_token, refresh_token, user } = authData
        
        if (user) {
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
          
          const response = NextResponse.redirect(`${SITE_URL}${next}`)
          
          // Set auth cookies
          response.cookies.set('sb-access-token', access_token, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/'
          })
          
          if (refresh_token) {
            response.cookies.set('sb-refresh-token', refresh_token, {
              httpOnly: true,
              secure: true,
              sameSite: 'lax',
              maxAge: 60 * 60 * 24 * 7,
              path: '/'
            })
          }
          
          return response
        }
      } else {
        const errorData = await authRes.text()
        console.error('Auth exchange failed:', errorData)
        // Redirect with specific error
        return NextResponse.redirect(`${SITE_URL}/login?error=exchange_failed`)
      }
    } catch (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(`${SITE_URL}/login?error=callback_error`)
    }
  }

  return NextResponse.redirect(`${SITE_URL}/login?error=no_code`)
}
