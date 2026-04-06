import { NextResponse } from 'next/server'
import { createEdgeClient } from '@/lib/supabase/edge'

export const runtime = 'edge';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://communityguard.pages.dev';

// ASCII Art for Sameer Shah branding
const CONSOLE_BRANDING = `
╔══════════════════════════════════════════════════════════╗
║     🔐 CommunityGuard Auth System by Sameer Shah 🔐     ║
║              @sameershahdev                              ║
╚══════════════════════════════════════════════════════════╝
`;

export async function GET(request: Request) {
  console.log(CONSOLE_BRANDING);
  console.log('🚀 [SameerShahDev] Auth callback initiated');
  
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  
  console.log('📋 [SameerShahDev] Request details:', { 
    hasCode: !!code, 
    next,
    timestamp: new Date().toISOString()
  });

  if (!code) {
    console.error('❌ [SameerShahDev] No authorization code provided!');
    return NextResponse.redirect(`${SITE_URL}/login?error=no_code`)
  }

  const supabase = createEdgeClient()
  
  console.log('🔑 [SameerShahDev] Supabase client created');
  
  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  console.log('🔑 [SameerShahDev] Environment check:', {
    supabaseUrl: supabaseUrl ? '✅' : '❌',
    anonKey: supabaseAnonKey ? '✅' : '❌',
    anonKeyLength: supabaseAnonKey?.length || 0
  });
  
  try {
    // Get all cookies from request
    const cookieHeader = request.headers.get('cookie') || ''
    console.log('🍪 [SameerShahDev] Raw cookie header:', cookieHeader);
    
    // Parse cookies properly
    const cookies: Record<string, string> = {}
    cookieHeader.split(';').forEach(cookie => {
      const [key, ...valueParts] = cookie.trim().split('=')
      if (key) {
        cookies[key] = valueParts.join('=') // Handle values that might contain =
      }
    })
    
    console.log('🍪 [SameerShahDev] Parsed cookies:', Object.keys(cookies));
    
    // Try multiple possible code verifier cookie names
    const possibleCookieNames = [
      'sb-code-verifier',
      'supabase-auth-code-verifier',
      'sb-lxizfxueyiixsctmtprq-code-verifier',
      'sb-auth-token-code-verifier'
    ];
    
    let codeVerifier: string | undefined;
    for (const name of possibleCookieNames) {
      if (cookies[name]) {
        codeVerifier = cookies[name];
        console.log(`✅ [SameerShahDev] Found code verifier in cookie: ${name}`);
        break;
      }
    }
    
    // Also check for any cookie containing "code-verifier"
    if (!codeVerifier) {
      for (const [key, value] of Object.entries(cookies)) {
        if (key.includes('code-verifier') || key.includes('verifier')) {
          codeVerifier = value;
          console.log(`✅ [SameerShahDev] Found code verifier in matching cookie: ${key}`);
          break;
        }
      }
    }
    
    if (!codeVerifier) {
      console.warn('⚠️ [SameerShahDev] No code verifier cookie found! Available cookies:', Object.keys(cookies));
    } else {
      console.log('🔑 [SameerShahDev] Code verifier length:', codeVerifier.length);
    }

    // Exchange code for session using Supabase auth API with PKCE
    const tokenUrl = new URL(`${supabaseUrl}/auth/v1/token`)
    tokenUrl.searchParams.set('grant_type', 'authorization_code')
    
    const requestBody: Record<string, string> = {
      code: code,
      redirect_uri: `${SITE_URL}/auth/callback`
    }
    
    // PKCE requires code_verifier
    if (codeVerifier) {
      requestBody.code_verifier = codeVerifier
      console.log('🔐 [SameerShahDev] Including code verifier in token request');
    } else {
      console.error('❌ [SameerShahDev] No code verifier found! PKCE flow will fail.');
    }
    
    console.log('📤 [SameerShahDev] Sending token exchange request...');
    
    const authRes = await fetch(tokenUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify(requestBody)
    })
    
    console.log('📥 [SameerShahDev] Token exchange response status:', authRes.status);
    
    if (!authRes.ok) {
      const errorData = await authRes.text()
      console.error('❌ [SameerShahDev] Token exchange failed!');
      console.error('   Status:', authRes.status);
      console.error('   Error:', errorData.slice(0, 500));
      return NextResponse.redirect(`${SITE_URL}/login?error=token_exchange_failed`)
    }
    
    const authData = await authRes.json()
    console.log('✅ [SameerShahDev] Token exchange successful!');
    console.log('   User ID:', authData.user?.id);
    console.log('   Email:', authData.user?.email);
    
    const { access_token, refresh_token, user } = authData

    // Save user to database
    console.log('💾 [SameerShahDev] Saving user to database...');
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
      
      console.log('✅ [SameerShahDev] User saved successfully:', user.id);
    } catch (dbError) {
      console.error('⚠️ [SameerShahDev] Database error (non-fatal):', dbError);
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
    console.log('🍪 [SameerShahDev] Set sb-access-token cookie');
    
    if (refresh_token) {
      response.cookies.set('sb-refresh-token', refresh_token, cookieOptions)
      console.log('🍪 [SameerShahDev] Set sb-refresh-token cookie');
    }
    
    response.cookies.set('sb-session', 'active', {
      secure: isSecure,
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    console.log('🎉 [SameerShahDev] Auth successful! Redirecting to:', next);
    console.log('═══════════════════════════════════════════════════════════');
    
    return response
    
  } catch (error) {
    console.error('💥 [SameerShahDev] Auth callback exception:', error);
    console.error('═══════════════════════════════════════════════════════════');
    return NextResponse.redirect(`${SITE_URL}/login?error=auth_exception`)
  }
}
