import { type NextRequest, NextResponse } from 'next/server';

// Waitlist branch: only allow the landing page and waitlist API.
// Everything else returns 404.
const ALLOWED_PATHS = ['/', '/api/waitlist'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets, Next.js internals, and favicon
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|css|js)$/)
  ) {
    return NextResponse.next();
  }

  // Allow only whitelisted paths
  if (ALLOWED_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Block everything else — redirect to home
  return NextResponse.redirect(new URL('/', request.url));
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
