import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export { default } from 'next-auth/middleware';

export async function proxy(req: NextRequest) {
  const { nextUrl } = req;
  const { pathname, origin, searchParams } = nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    if (pathname === '/') {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/login', origin));
  }

  if (pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', origin));
  }

  return NextResponse.next();
}

export const config = { matcher: ['/((?!api|_next/static|_next/image|images|favicon.ico).*)'] };
