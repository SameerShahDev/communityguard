import { NextResponse } from 'next/server'

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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  try {
    // Step 1: Exchange Discord OAuth code for Supabase session
    // This endpoint exchanges the external provider code for a Supabase session
    const tokenUrl = new URL(`${supabaseUrl}/auth/v1/token`)
    tokenUrl.searchParams.set('grant_type', 'authorization_code')
    
    const authRes = await fetch(tokenUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({ 
        code: code,
        redirect_uri: `${SITE_URL}/auth/callback`
      })
    })
    
    // Log the response status for debugging
    console.log('Token exchange response status:', authRes.status)
    
    if (!authRes.ok) {
      const errorData = await authRes.text()
      console.error('Token exchange failed:', errorData)
      return NextResponse.redirect(`${SITE_URL}/login?error=token_exchange_failed`)
    }
    
    const authData = await authRes.json()
    console.log('Token exchange successful, user:', authData.user?.id)
    
    const { access_token, refresh_token, user } = authData
    
    if (!user || !access_token) {
      console.error('Missing user or access token in response')
      return NextResponse.redirect(`${SITE_URL}/login?error=invalid_token_response`)
    }

    // Step 2: Save user to database
    try {
      const { createEdgeClient } = await import('@/lib/supabase/edge')
      const edgeSupabase = createEdgeClient()
      
      const discord_id = user.user_metadata?.provider_id || 
                        user.user_metadata?.sub || 
                        user.identities?.find((i: any) => i.provider === 'discord')?.id;
      
      await edgeSupabase
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

    // Step 3: Create response with cookies
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
    response.cookies.set('sb-access-token', access_token, cookieOptions)
    
    // Refresh token
    if (refresh_token) {
      response.cookies.set('sb-refresh-token', refresh_token, cookieOptions)
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
