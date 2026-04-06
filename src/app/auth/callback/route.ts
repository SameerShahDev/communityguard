import { NextResponse } from 'next/server'

export const runtime = 'edge';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://communityguard.pages.dev';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  
  console.log('Auth callback:', { hasCode: !!code, url: request.url })

  if (!code) {
    return NextResponse.redirect(`${SITE_URL}/login?error=no_code`)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  try {
    // Exchange code for session using Supabase auth API
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
    
    if (!authRes.ok) {
      const errorData = await authRes.text()
      console.error('Auth failed:', errorData)
      return NextResponse.redirect(`${SITE_URL}/login?error=auth_failed`)
    }
    
    const authData = await authRes.json()
    const { access_token, refresh_token, expires_at, user } = authData
    
    if (!user) {
      return NextResponse.redirect(`${SITE_URL}/login?error=no_user`)
    }

    console.log('User authenticated:', user.id)

    // Save user to database
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

    // Create response with redirect
    const response = NextResponse.redirect(`${SITE_URL}${next}`)
    
    // Set cookies with proper options - Edge Runtime compatible
    // Use the request's origin to determine if secure cookies should be used
    const isSecure = request.url.startsWith('https://')
    const cookieOptions = {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    }
    
    response.cookies.set('sb-access-token', access_token, cookieOptions)
    
    if (refresh_token) {
      response.cookies.set('sb-refresh-token', refresh_token, cookieOptions)
    }
    
    // Set a session indicator cookie (not httpOnly, for client-side checks)
    response.cookies.set('sb-session', 'active', {
      secure: isSecure,
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    })

    console.log('Cookies set, redirecting to:', next)
    return response
    
  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(`${SITE_URL}/login?error=exception`)
  }
}
