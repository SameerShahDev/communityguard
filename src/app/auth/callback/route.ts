import { NextResponse } from 'next/server'
import { createEdgeClient } from '@/lib/supabase/edge'

// Edge Runtime for Cloudflare Pages compatibility
export const runtime = 'edge';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://communityguard.pages.dev';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  
  console.log('Auth callback called:', { hasCode: !!code, url: request.url })

  if (!code) {
    console.error('No authorization code provided')
    return NextResponse.redirect(`${SITE_URL}/login?error=no_code`)
  }

  try {
    // Use Supabase client to exchange the code for a session
    const supabase = createEdgeClient()
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error || !data.session) {
      console.error('Token exchange failed:', error?.message || 'No session returned')
      return NextResponse.redirect(`${SITE_URL}/login?error=token_exchange_failed`)
    }

    const { session, user } = data
    
    if (!user || !session.access_token) {
      console.error('Missing user or access token in response')
      return NextResponse.redirect(`${SITE_URL}/login?error=invalid_token_response`)
    }

    console.log('Token exchange successful, user:', user.id)

    // Save user to database
    try {
      const discord_id = user.user_metadata?.provider_id || 
                        user.user_metadata?.sub || 
                        user.identities?.find((i: any) => i.provider === 'discord')?.id;
      
      await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email!,
          discord_id: discord_id,
          pro_days_left: 30,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      
      console.log('User saved to database:', user.id)
    } catch (dbError) {
      console.error('Database error (non-fatal):', dbError)
      // Continue even if DB fails - user can still be authenticated
    }

    // Create response with redirect
    const response = NextResponse.redirect(`${SITE_URL}${next}`)
    
    // Set cookies with proper options for production
    const isSecure = SITE_URL.startsWith('https://')
    const cookieOptions = {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    }
    
    // Primary auth cookie
    response.cookies.set('sb-access-token', session.access_token, cookieOptions)
    
    // Refresh token
    if (session.refresh_token) {
      response.cookies.set('sb-refresh-token', session.refresh_token, cookieOptions)
    }
    
    // Session indicator for client-side checks (not httpOnly)
    response.cookies.set('sb-session', 'active', {
      secure: isSecure,
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    })

    console.log('Auth successful, redirecting to:', next)
    return response
    
  } catch (error) {
    console.error('Auth callback exception:', error)
    return NextResponse.redirect(`${SITE_URL}/login?error=auth_exception`)
  }
}
