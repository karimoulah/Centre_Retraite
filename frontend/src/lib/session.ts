import 'server-only';

import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { api } from '@/lib/api/api';
import type { Role, SessionUser } from '@/lib/api/contracts';
import { isApiError } from '@/lib/api/errors';
import { ACCESS_COOKIE, STAFF_ROLES } from '@/lib/auth/config';

/** Current user from GET /auth/me, or null. Cached for the duration of one request. */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  if (!cookieStore.get(ACCESS_COOKIE)) return null;
  try {
    return await api<SessionUser>('/auth/me', { redirectOnUnauthorized: false });
  } catch (error) {
    if (isApiError(error) && error.status === 401) return null;
    throw error;
  }
});

export const hasRole = (user: SessionUser | null, ...roles: Role[]) =>
  !!user && roles.some((role) => user.roles.includes(role));

export const isStaff = (user: SessionUser | null) => hasRole(user, ...STAFF_ROLES);

async function loginUrl() {
  const pathname = (await headers()).get('x-pathname') ?? '/';
  return `/login?next=${encodeURIComponent(pathname)}`;
}

/** Any signed-in user; otherwise redirect to /login?next=… */
export async function requireSession(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect(await loginUrl());
  return user;
}

/** Signed-in user holding at least one of `roles`; otherwise /login or /forbidden (403). */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireSession();
  if (!hasRole(user, ...roles)) redirect('/forbidden');
  return user;
}

/** Where to send a user right after login when no `next` is given. */
export const homeFor = (user: SessionUser) => (isStaff(user) ? '/backoffice' : '/account/profile');

/** Accepts only same-site relative paths, to avoid open redirects through `?next=`. */
export function safeNext(next: string | null | undefined): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return null;
  return next;
}
