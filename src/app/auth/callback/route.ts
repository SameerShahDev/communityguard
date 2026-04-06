import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in search params, use it as the redirection URL
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && session) {
      // Sync user to database
      const user = session.user;
      const discord_id = user.user_metadata?.provider_id || user.user_metadata?.sub;
      
      await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email!,
          discord_id: discord_id,
          pro_days_left: 30 // Initial Trial
        }, { onConflict: 'email' });

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
