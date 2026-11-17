import { NextResponse, type NextRequest } from 'next/server';

import { ACCESS_COOKIE, PROTECTED_PREFIXES, REFRESH_COOKIE } from '@/lib/auth/config';
import { decodeJwtPayload, isTokenExpired } from '@/lib/auth/token';
import { mockSessionCookies } from '@/lib/api/mocks/auth';

const isProtected = (pathname: string) =>
  PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

/** Asks the API for new tokens with the refresh cookie. Returns the Set-Cookie headers, or []. */
async function refreshSession(refreshToken: string): Promise<string[]> {
  if (process.env.API_MODE === 'mock') {
    const payload = decodeJwtPayload<{ sub: string; exp: number }>(refreshToken);
    return payload && payload.exp * 1000 > Date.now() ? mockSessionCookies(payload.sub) : [];
  }
  try {
    const response = await fetch(`${process.env.API_URL ?? 'http://localhost:3000/api'}/auth/refresh`, {
      method: 'POST',
      headers: { cookie: `${REFRESH_COOKIE}=${refreshToken}`, accept: 'application/json' },
      cache: 'no-store',
    });
    return response.ok ? response.headers.getSetCookie() : [];
  } catch {
    return [];
  }
}

/** name=value pairs from Set-Cookie headers, to update the cookies seen by this request. */
const cookiePairs = (setCookies: string[]) =>
  new Map(
    setCookies.map((header) => {
      const pair = header.split(';')[0];
      const index = pair.indexOf('=');
      return [pair.slice(0, index), pair.slice(index + 1)] as const;
    }),
  );

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  // Lets Server Components build /login?next=… links.
  requestHeaders.set('x-pathname', `${pathname}${search}`);

  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  let setCookies: string[] = [];

  // Transparent renewal: the access token is missing or about to expire, but a refresh token exists.
  if (refresh && isTokenExpired(access)) {
    setCookies = await refreshSession(refresh);
    if (setCookies.length) {
      const renewed = cookiePairs(setCookies);
      const merged = request.cookies
        .getAll()
        .filter((c) => !renewed.has(c.name))
        .map((c) => `${c.name}=${c.value}`);
      for (const [name, value] of renewed) merged.push(`${name}=${value}`);
      requestHeaders.set('cookie', merged.join('; '));
    }
  }

  const signedIn = setCookies.length > 0 || !isTokenExpired(access, 0);

  if (isProtected(pathname) && !signedIn) {
    const url = new URL('/login', request.url);
    url.searchParams.set('next', `${pathname}${search}`);
    if (refresh || access) url.searchParams.set('reason', 'expired');
    const response = NextResponse.redirect(url);
    response.cookies.delete(ACCESS_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);
    return response;
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  for (const header of setCookies) response.headers.append('set-cookie', header);
  return response;
}

export const config = {
  // Skip Next internals, static files, the Payload console and API, and the NestJS proxy.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|admin|api|backend|.*\\.[a-zA-Z0-9]+$).*)'],
};
