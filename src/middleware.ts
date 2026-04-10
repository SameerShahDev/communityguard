import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if user is authenticated
  const authToken = request.cookies.get('sb-access-token')?.value || 
                    request.cookies.get('supabase-auth-token')?.value;

  // If user is on login page and already authenticated, redirect to dashboard
  if (pathname === '/login' && authToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Protect dashboard routes - require authentication
  if (pathname.startsWith('/dashboard')) {
    if (!authToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Protect admin routes - require admin role (simplified check)
  if (pathname.startsWith('/admin')) {
    if (!authToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Note: Admin check would need to be done in the page itself
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/admin/:path*', '/dashboard/:path*', '/((?!auth/callback|api).*)']
};
