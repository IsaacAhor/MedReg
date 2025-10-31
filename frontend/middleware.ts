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

  if (!isAuthed) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Apply to all routes except assets and public ones
    '/((?!_next/|favicon|assets).*)',
  ],
};

