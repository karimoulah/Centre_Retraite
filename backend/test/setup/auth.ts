import request from 'supertest';

import type { Role, User } from '../../src/database/entities';
import { createUser, TEST_PASSWORD } from '../factories/users';
import type { TestApp } from './app';

export type SignedIn = { user: User; cookies: string[] };

/** Creates a user with these roles, signs in through the real endpoint and returns its cookies. */
export async function loginAs(t: TestApp, roles: Role | Role[], overrides: Parameters<typeof createUser>[1] = {}): Promise<SignedIn> {
  const user = await createUser(t.dataSource, { ...overrides, roles: ([] as Role[]).concat(roles) });
  const res = await request(t.http).post('/api/v1/auth/login').send({ email: user.email, password: TEST_PASSWORD });
  if (res.status !== 200) throw new Error(`loginAs failed: ${res.status} ${JSON.stringify(res.body)}`);
  const cookies = ([] as string[]).concat(res.headers['set-cookie']).map((c) => c.split(';')[0]);
  return { user, cookies };
}

/** Shorthand for authenticated requests: as(t, session).get('/users'). */
export function as(t: TestApp, session: SignedIn) {
  const agent = request(t.http);
  const prefix = (path: string) => `/api/v1${path}`;
  return {
    get: (path: string) => agent.get(prefix(path)).set('Cookie', session.cookies),
    post: (path: string) => agent.post(prefix(path)).set('Cookie', session.cookies),
    put: (path: string) => agent.put(prefix(path)).set('Cookie', session.cookies),
    patch: (path: string) => agent.patch(prefix(path)).set('Cookie', session.cookies),
    delete: (path: string) => agent.delete(prefix(path)).set('Cookie', session.cookies),
  };
}
