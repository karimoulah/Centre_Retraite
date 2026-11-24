import request from 'supertest';

import { User } from '../../src/database/entities';
import { createTestApp, type TestApp } from '../setup/app';
import { createUser, TEST_PASSWORD } from '../factories/users';
import { as, loginAs } from '../setup/auth';

const cookieOf = (setCookie: string[] | string, name: string) =>
  ([] as string[]).concat(setCookie).find((c) => c.startsWith(`${name}=`))!.split(';')[0];

describe('Session: me, refresh, logout (B1-02)', () => {
  let t: TestApp;
  beforeAll(async () => (t = await createTestApp()));
  afterAll(() => t.app.close());

  async function signIn() {
    const user = await createUser(t.dataSource, { roles: ['MEMBER'] });
    const res = await request(t.http).post('/api/v1/auth/login').send({ email: user.email, password: TEST_PASSWORD }).expect(200);
    return { user, access: cookieOf(res.headers['set-cookie'], 'access_token'), refresh: cookieOf(res.headers['set-cookie'], 'refresh_token') };
  }

  it('GET /auth/me returns the signed-in user', async () => {
    const session = await loginAs(t, 'ADMIN');
    const { user } = session;
    const res = await as(t, session).get('/auth/me').expect(200);
    expect(res.body).toMatchObject({ id: user.id, email: user.email, roles: ['ADMIN'], memberId: null });
  });

  it('GET /auth/me refuses a request without a session', async () => {
    await request(t.http).get('/api/v1/auth/me').expect(401);
  });

  it('refresh rotates the session: the old refresh token stops working', async () => {
    const { refresh } = await signIn();
    const first = await request(t.http).post('/api/v1/auth/refresh').set('Cookie', refresh).expect(200);
    const access = cookieOf(first.headers['set-cookie'], 'access_token');
    await request(t.http).get('/api/v1/auth/me').set('Cookie', access).expect(200);
    const replay = await request(t.http).post('/api/v1/auth/refresh').set('Cookie', refresh).expect(401);
    expect(replay.body.code).toBe('SESSION_EXPIRED');
  });

  it('after logout the refresh token is refused and the cookies are cleared', async () => {
    const { refresh } = await signIn();
    const out = await request(t.http).post('/api/v1/auth/logout').set('Cookie', refresh).expect(204);
    expect(([] as string[]).concat(out.headers['set-cookie']).join()).toMatch(/access_token=;/);
    await request(t.http).post('/api/v1/auth/refresh').set('Cookie', refresh).expect(401);
  });

  it('a deactivated user loses access immediately', async () => {
    const { user, access } = await signIn();
    await t.dataSource.getRepository(User).update(user.id, { active: false });
    await request(t.http).get('/api/v1/auth/me').set('Cookie', access).expect(401);
  });
});
