import request from 'supertest';

import { AuditLog, User } from '../../src/database/entities';
import { createTestApp, type TestApp } from '../setup/app';
import { createUser, TEST_PASSWORD } from '../factories/users';

describe('POST /auth/login (B1-01)', () => {
  let t: TestApp;
  beforeAll(async () => (t = await createTestApp()));
  afterAll(() => t.app.close());

  const login = (email: string, password: string) =>
    request(t.http).post('/api/v1/auth/login').send({ email, password });

  it('signs in and sets two httpOnly cookies', async () => {
    const user = await createUser(t.dataSource, { roles: ['FINANCE'] });
    const res = await login(user.email.toUpperCase(), TEST_PASSWORD).expect(200);
    expect(res.body.user).toEqual({
      id: user.id,
      email: user.email,
      firstName: 'Test',
      lastName: user.lastName,
      roles: ['FINANCE'],
      memberId: null,
    });
    const cookies = ([] as string[]).concat(res.headers['set-cookie']);
    expect(cookies.find((c) => c.startsWith('access_token='))).toMatch(/HttpOnly; SameSite=Lax/);
    expect(cookies.find((c) => c.startsWith('refresh_token='))).toMatch(/HttpOnly/);
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('gives the same generic message for an unknown e-mail and a wrong password', async () => {
    const user = await createUser(t.dataSource);
    const unknown = await login('personne@test.local', TEST_PASSWORD).expect(401);
    const wrong = await login(user.email, 'mauvais').expect(401);
    expect(unknown.body).toEqual(wrong.body);
    expect(wrong.body).toEqual({ code: 'INVALID_CREDENTIALS', message: 'Courriel ou mot de passe incorrect.' });
  });

  it('refuses a deactivated account with the same message', async () => {
    const user = await createUser(t.dataSource, { active: false });
    await login(user.email, TEST_PASSWORD).expect(401);
  });

  it('locks the account for 15 minutes after 5 failures, even with the right password', async () => {
    const user = await createUser(t.dataSource);
    for (let i = 0; i < 5; i += 1) await login(user.email, 'mauvais').expect(401);
    const locked = await login(user.email, TEST_PASSWORD).expect(423);
    expect(locked.body.code).toBe('ACCOUNT_LOCKED');
    const stored = await t.dataSource.getRepository(User).findOneByOrFail({ id: user.id });
    expect(stored.lockedUntil!.getTime()).toBeGreaterThan(Date.now() + 14 * 60_000);
    expect(await t.dataSource.getRepository(AuditLog).countBy({ entityId: user.id, action: 'ACCOUNT_LOCKED' })).toBe(1);
  });

  it('validates the body in French', async () => {
    const res = await login('pas-un-courriel', '').expect(422);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(res.body.details.map((d: { field: string }) => d.field)).toEqual(['email', 'password']);
  });
});
