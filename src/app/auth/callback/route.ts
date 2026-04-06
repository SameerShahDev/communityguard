import { NextResponse } from 'next/server'

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
    // Get cookies from request
    const cookieHeader = request.headers.get('cookie') || ''
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => c.trim().split('=')).filter(([k]) => k)
    )
    
    // Get PKCE code verifier from cookie
    const codeVerifier = cookies['sb-code-verifier'] || cookies['supabase-auth-code-verifier']
    
    console.log('Code verifier present:', !!codeVerifier)

    // Exchange code for session using Supabase auth API with PKCE
    const tokenUrl = new URL(`${supabaseUrl}/auth/v1/token`)
    tokenUrl.searchParams.set('grant_type', 'pkce')
    
    const requestBody: Record<string, string> = {
      auth_code: code,
      redirect_uri: `${SITE_URL}/auth/callback`
    }
    
    if (codeVerifier) {
      requestBody.code_verifier = codeVerifier
    }
    
    const authRes = await fetch(tokenUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify(requestBody)
    })
    
    console.log('Token exchange status:', authRes.status)
    
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

    // Save user to database
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
    }

    // Create response with redirect
    const response = NextResponse.redirect(`${SITE_URL}${next}`)
    
    // Set cookies
    const isSecure = SITE_URL.startsWith('https://')
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
    
    // Clear code verifier cookie
    if (codeVerifier) {
      response.cookies.set('sb-code-verifier', '', { maxAge: 0, path: '/' })
    }
    
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
