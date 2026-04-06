import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Use Node.js runtime for proper cookie handling with Supabase
export const runtime = 'nodejs';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://communityguard.pages.dev';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  
  console.log('Auth callback:', { hasCode: !!code, url: request.url })

  if (!code) {
    console.error('No authorization code provided')
    return NextResponse.redirect(`${SITE_URL}/login?error=no_code`)
  }

  try {
    // Use Supabase server client for session exchange
    const supabase = await createClient()
    
    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error || !data.session) {
      console.error('Session exchange failed:', error?.message || 'No session')
      return NextResponse.redirect(`${SITE_URL}/login?error=session_failed`)
    }

    const { session } = data
    const user = session.user
    
    if (!user) {
      console.error('No user in session')
      return NextResponse.redirect(`${SITE_URL}/login?error=no_user`)
    }

    console.log('User authenticated:', user.id)

    // Save/update user in database
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

    console.log('User saved to database')

    // Create redirect response
    const response = NextResponse.redirect(`${SITE_URL}${next}`)
    
    // Set cookies with proper options for production
    response.cookies.set('sb-access-token', session.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    })
    
    if (session.refresh_token) {
      response.cookies.set('sb-refresh-token', session.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/'
      })
    }
    
    console.log('Cookies set, redirecting to:', next)
    return response
    
  } catch (error) {
    console.error('Auth callback exception:', error)
    return NextResponse.redirect(`${SITE_URL}/login?error=exception`)
  }
}
