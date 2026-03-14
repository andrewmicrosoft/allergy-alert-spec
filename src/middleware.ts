import { NextResponse, type NextRequest } from 'next/server';

/** Routes that require authentication */
const protectedPaths = ['/profile', '/query', '/history', '/api/allergens', '/api/queries'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
  if (!isProtected) {
    return NextResponse.next();
  }

  // For API routes, check for Authorization header
  if (pathname.startsWith('/api/')) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // For page routes, check for MSAL session
  // MSAL stores tokens in sessionStorage (client-side), so we can't check them in middleware.
  // Instead, the client-side AuthGuard components handle redirect to login.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/profile/:path*',
    '/query/:path*',
    '/history/:path*',
    '/api/allergens/:path*',
    '/api/queries/:path*',
  ],
};
