import type { AuthStrategy } from 'payload';

import type { SessionUser } from '@/lib/api/contracts';
import { handleMock } from '@/lib/api/mocks';
import { ACCESS_COOKIE } from '@/lib/auth/config';

function readCookies(header: string | null): Map<string, string> {
  const cookies = new Map<string, string>();
  for (const part of (header ?? '').split(';')) {
    const index = part.indexOf('=');
    if (index > 0) cookies.set(part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim()));
  }
  return cookies;
}

/** Asks the NestJS API who owns the session cookie (GET /auth/me). */
async function fetchSessionUser(cookieHeader: string | null): Promise<SessionUser | null> {
  const cookies = readCookies(cookieHeader);
  if (!cookies.get(ACCESS_COOKIE)) return null;

  if (process.env.API_MODE === 'mock') {
    const response = await handleMock({ method: 'GET', path: '/auth/me', query: new URLSearchParams(), body: undefined, cookies });
    return response.status === 200 ? (response.body as SessionUser) : null;
  }
  try {
    const response = await fetch(`${process.env.API_URL ?? 'http://localhost:3000/api'}/auth/me`, {
      headers: { cookie: cookieHeader ?? '', accept: 'application/json' },
      cache: 'no-store',
    });
    return response.ok ? ((await response.json()) as SessionUser) : null;
  } catch {
    return null;
  }
}

/**
 * Payload has no login of its own: the NestJS JWT cookie is the only identity.
 * The matching Payload user is created on first visit and its roles kept in sync.
 */
export const nestJwtStrategy: AuthStrategy = {
  name: 'nest-jwt',
  authenticate: async ({ headers, payload }) => {
    const sessionUser = await fetchSessionUser(headers.get('cookie'));
    if (!sessionUser) return { user: null };

    const { docs } = await payload.find({
      collection: 'users',
      where: { email: { equals: sessionUser.email } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const data = {
      email: sessionUser.email,
      apiUserId: sessionUser.id,
      name: `${sessionUser.firstName} ${sessionUser.lastName}`,
      roles: sessionUser.roles,
    };
    const existing = docs[0];
    const sameRoles = existing && [...(existing.roles ?? [])].sort().join() === [...sessionUser.roles].sort().join();
    const user = !existing
      ? await payload.create({ collection: 'users', data, overrideAccess: true })
      : sameRoles
        ? existing
        : await payload.update({ collection: 'users', id: existing.id, data, overrideAccess: true });

    return { user: { ...user, collection: 'users', _strategy: 'nest-jwt' } };
  },
};
