import type { Role, SessionUser } from '../contracts';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '../../auth/config';
import { decodeJwtPayload, encodeMockToken } from '../../auth/token';
import { fail, mockStore, ok, type MockRequest, type MockResponse, type MockRoute } from './types';

export const MOCK_PASSWORD = 'Motdepasse123!';
export const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;
const MAX_FAILED_ATTEMPTS = 5;

export type MockUser = SessionUser & {
  password: string;
  active: boolean;
  invitationPending: boolean;
  failedAttempts: number;
  createdAt: string;
  lastLoginAt: string | null;
};

const user = (id: string, email: string, firstName: string, lastName: string, roles: Role[]): MockUser => ({
  id,
  email,
  firstName,
  lastName,
  roles,
  password: MOCK_PASSWORD,
  active: true,
  invitationPending: false,
  failedAttempts: 0,
  createdAt: '2026-11-01T14:00:00.000Z',
  lastLoginAt: null,
});

/** Demo accounts, one per role. All use MOCK_PASSWORD. */
export const mockUsers = () =>
  mockStore<MockUser[]>('users', () => [
    user('u-admin', 'admin@lesaines.test', 'Aminata', 'Diallo', ['ADMIN']),
    user('u-finance', 'finance@lesaines.test', 'Marc', 'Tremblay', ['FINANCE']),
    user('u-testimonials', 'temoignages@lesaines.test', 'Julie', 'Gagnon', ['TESTIMONIALS']),
    user('u-member', 'membre@lesaines.test', 'Robert', 'Lavoie', ['MEMBER']),
    user('u-multi', 'direction@lesaines.test', 'Claire', 'Bouchard', ['ADMIN', 'FINANCE']),
    // Already locked, to demonstrate the locked-account message.
    { ...user('u-locked', 'bloque@lesaines.test', 'Paul', 'Côté', ['MEMBER']), failedAttempts: MAX_FAILED_ATTEMPTS },
  ]);

export const publicUser = ({ id, email, firstName, lastName, roles }: MockUser): SessionUser => ({
  id,
  email,
  firstName,
  lastName,
  roles,
});

const cookie = (name: string, value: string, maxAge: number) =>
  `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;

/** Set-Cookie headers for a fresh mock session (also used by the middleware's mock refresh). */
export function mockSessionCookies(userId: string): string[] {
  const now = Math.floor(Date.now() / 1000);
  const access = encodeMockToken({ sub: userId, exp: now + ACCESS_TTL_SECONDS });
  const refresh = encodeMockToken({ sub: userId, typ: 'refresh', exp: now + REFRESH_TTL_SECONDS });
  return [cookie(ACCESS_COOKIE, access, ACCESS_TTL_SECONDS), cookie(REFRESH_COOKIE, refresh, REFRESH_TTL_SECONDS)];
}

export const issueMockSession = (account: MockUser) => mockSessionCookies(account.id);

/** Returns the user behind the access cookie, or null (expired, missing, deactivated). */
export function currentMockUser(request: MockRequest): MockUser | null {
  const token = request.cookies.get(ACCESS_COOKIE);
  const payload = token ? decodeJwtPayload<{ sub: string; exp: number }>(token) : null;
  if (!payload || payload.exp * 1000 < Date.now()) return null;
  const account = mockUsers().find((u) => u.id === payload.sub);
  return account?.active ? account : null;
}

export const unauthorized = () => fail(401, 'UNAUTHORIZED', 'Authentification requise.');

/** Returns the current user if they hold one of `roles`, or the 401/403 response to send. */
export function guard(request: MockRequest, ...roles: Role[]): MockUser | MockResponse {
  const account = currentMockUser(request);
  if (!account) return unauthorized();
  if (roles.length && !roles.some((role) => account.roles.includes(role))) {
    return fail(403, 'FORBIDDEN', "Vous n'avez pas accès à cette ressource.");
  }
  return account;
}

export const isResponse = (value: MockUser | MockResponse): value is MockResponse => 'status' in value;

export const actorOf = (account: MockUser) => ({ id: account.id, name: `${account.firstName} ${account.lastName}` });

export const authRoutes: MockRoute[] = [
  {
    method: 'POST',
    path: '/auth/login',
    handler: ({ body }) => {
      const { email, password } = (body ?? {}) as { email?: string; password?: string };
      const account = mockUsers().find((u) => u.email.toLowerCase() === email?.trim().toLowerCase());
      if (account && account.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        return fail(423, 'ACCOUNT_LOCKED', 'Compte bloqué après plusieurs tentatives.');
      }
      if (!account || account.password !== password || !account.active) {
        if (account) account.failedAttempts += 1;
        return fail(401, 'INVALID_CREDENTIALS', 'Courriel ou mot de passe incorrect.');
      }
      account.failedAttempts = 0;
      account.lastLoginAt = new Date().toISOString();
      return ok({ user: publicUser(account) }, issueMockSession(account));
    },
  },
  {
    method: 'POST',
    path: '/auth/logout',
    handler: () =>
      ok(undefined, [cookie(ACCESS_COOKIE, '', 0), cookie(REFRESH_COOKIE, '', 0)]),
  },
  {
    method: 'POST',
    path: '/auth/refresh',
    handler: ({ cookies }) => {
      const token = cookies.get(REFRESH_COOKIE);
      const payload = token ? decodeJwtPayload<{ sub: string; exp: number }>(token) : null;
      const account = payload && payload.exp * 1000 > Date.now() ? mockUsers().find((u) => u.id === payload.sub) : null;
      if (!account?.active) return unauthorized();
      return ok({ user: publicUser(account) }, issueMockSession(account));
    },
  },
  {
    method: 'GET',
    path: '/auth/me',
    handler: (request) => {
      const account = currentMockUser(request);
      return account ? ok(publicUser(account)) : unauthorized();
    },
  },
];

/** Demo tokens: "demo-reset-token" works, anything else is expired. */
export const passwordRoutes: MockRoute[] = [
  { method: 'POST', path: '/auth/password/forgot', handler: () => ok({ sent: true }) },
  {
    method: 'POST',
    path: '/auth/password/reset',
    handler: ({ body }) => {
      const { token } = (body ?? {}) as { token?: string; password?: string };
      if (token !== 'demo-reset-token') return fail(410, 'TOKEN_EXPIRED', 'Ce lien a expiré.');
      return ok({ reset: true });
    },
  },
];
