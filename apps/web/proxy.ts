import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/', '/login'];

export async function proxy(req: NextRequest) {
  const { nextUrl } = req;
  const { pathname, origin } = nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    if (PUBLIC_PATHS.includes(pathname)) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/login', origin));
  }

  // Do not redirect /login → /dashboard here. AuthProvider may sign the user out to
  // /login when the API is unavailable; forcing /dashboard causes ERR_TOO_MANY_REDIRECTS.

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', origin));
  }

  return NextResponse.next();
}

export const config = { matcher: ['/((?!api|_next/static|_next/image|images|favicon.ico).*)'] };
