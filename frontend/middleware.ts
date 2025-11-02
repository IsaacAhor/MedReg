import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public paths that do not require auth
const publicPaths = [
  '/',
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/session',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow Next internal assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/assets')
  ) {
    return NextResponse.next();
  }

  // Allow all public paths
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  const isAuthed = req.cookies.get('omrsAuth')?.value === '1';
  const role = req.cookies.get('omrsRole')?.value || '';

  if (!isAuthed) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Simple role gating for admin routes
  if (pathname.startsWith('/admin')) {
    if (role.toLowerCase() !== 'admin') {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Apply to all routes except assets and public ones
    '/((?!_next/|favicon|assets).*)',
  ],
};
