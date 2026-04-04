import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  // Only protect routes starting with /admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const supabase = await createClient();
    
    // Check if the user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Query users table for is_admin status
    const { data: user, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();

    if (error || !user?.is_admin) {
      console.warn("Unauthorized access attempt to /admin by user:", session.user.id);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/admin/:path*'],
};
