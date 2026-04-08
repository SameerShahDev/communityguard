import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'


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

  const supabase = await createClient()
  
  console.log('🔑 [SameerShahDev] Supabase client created');
  
  try {
    // Use Supabase built-in code exchange
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('� [SameerShahDev] Exchange result:', { 
      hasData: !!data, 
      hasError: !!error,
      error: error?.message
    });
    
    if (error) {
      console.error('❌ [SameerShahDev] Exchange failed:', error);
      return NextResponse.redirect(`${SITE_URL}/login?error=token_exchange_failed`)
    }
    
    const { user, session } = data
    console.log('✅ [SameerShahDev] Exchange successful! User:', user?.id);
    
    if (!user || !session?.access_token) {
      console.error('❌ [SameerShahDev] Missing user or access token in response!');
      return NextResponse.redirect(`${SITE_URL}/login?error=invalid_token_response`)
    }

    // Save user to database
    console.log('💾 [SameerShahDev] Saving user to database...');
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
      
      console.log('✅ [SameerShahDev] User saved successfully:', user.id);
    } catch (dbError) {
      console.error('⚠️ [SameerShahDev] Database error (non-fatal):', dbError);
    }

    console.log('🎉 [SameerShahDev] Auth successful! Redirecting to:', next);
    console.log('═══════════════════════════════════════════════════════════');
    
    // Create response with redirect and set cookies manually
    const response = NextResponse.redirect(`${SITE_URL}${next}`)
    
    // Set cookies manually for Edge Runtime
    const isSecure = SITE_URL.startsWith('https://')
    const cookieOptions = {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    }
    
    if (session?.access_token) {
      response.cookies.set('sb-access-token', session.access_token, cookieOptions)
      console.log('🍪 [SameerShahDev] Set sb-access-token cookie');
    }
    
    if (session?.refresh_token) {
      response.cookies.set('sb-refresh-token', session.refresh_token, cookieOptions)
      console.log('🍪 [SameerShahDev] Set sb-refresh-token cookie');
    }
    
    response.cookies.set('sb-session', 'active', {
      secure: isSecure,
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });
    
    console.log('🍪 [SameerShahDev] All cookies set successfully');
    
    return response
    
  } catch (error) {
    console.error('💥 [SameerShahDev] Auth callback exception:', error);
    console.error('═══════════════════════════════════════════════════════════');
    return NextResponse.redirect(`${SITE_URL}/login?error=auth_exception`)
  }
}
