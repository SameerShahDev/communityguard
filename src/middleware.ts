import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect dashboard routes - require authentication
  if (pathname.startsWith('/dashboard')) {
    // In Edge Runtime, we check for auth token in cookies manually
    const authToken = request.cookies.get('sb-access-token')?.value || 
                      request.cookies.get('supabase-auth-token')?.value;
    
    if (!authToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Protect admin routes - require admin role (simplified check)
  if (pathname.startsWith('/admin')) {
    const authToken = request.cookies.get('sb-access-token')?.value || 
                      request.cookies.get('supabase-auth-token')?.value;
    
    if (!authToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Note: Admin check would need to be done in the page itself
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*']
};
