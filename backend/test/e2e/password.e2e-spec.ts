import request from 'supertest';

import { Notification } from '../../src/database/entities';
import { createTestApp, type TestApp } from '../setup/app';
import { createUser, TEST_PASSWORD } from '../factories/users';

describe('Forgot and reset password (B1-05)', () => {
  let t: TestApp;
  beforeAll(async () => (t = await createTestApp()));
  afterAll(() => t.app.close());

  const post = (path: string, body: object) => request(t.http).post(`/api/v1/auth/password/${path}`).send(body);
  const tokenFromLastEmail = async (email: string) => {
    const n = await t.dataSource.getRepository(Notification).findOneOrFail({ where: { recipient: email }, order: { createdAt: 'DESC' } });
    return new URL(String(n.data.url)).searchParams.get('token')!;
  };

  it('answers the same whether the account exists or not', async () => {
    const user = await createUser(t.dataSource);
    const known = await post('forgot', { email: user.email }).expect(200);
    const unknown = await post('forgot', { email: 'personne@test.local' }).expect(200);
    expect(known.body).toEqual(unknown.body);
    expect(await t.dataSource.getRepository(Notification).countBy({ recipient: user.email, type: 'PASSWORD_RESET' })).toBe(1);
    expect(await t.dataSource.getRepository(Notification).countBy({ recipient: 'personne@test.local' })).toBe(0);
  });

  it('resets the password once with the link, then the link expires', async () => {
    const user = await createUser(t.dataSource);
    await post('forgot', { email: user.email }).expect(200);
    const token = await tokenFromLastEmail(user.email);
    await post('reset', { token, password: 'NouveauMotdepasse1' }).expect(200);
    await request(t.http).post('/api/v1/auth/login').send({ email: user.email, password: 'NouveauMotdepasse1' }).expect(200);
    await request(t.http).post('/api/v1/auth/login').send({ email: user.email, password: TEST_PASSWORD }).expect(401);
    const again = await post('reset', { token, password: 'EncoreUnAutre12' }).expect(410);
    expect(again.body.code).toBe('TOKEN_EXPIRED');
  });

  it('only the latest link works', async () => {
    const user = await createUser(t.dataSource);
    await post('forgot', { email: user.email });
    const first = await tokenFromLastEmail(user.email);
    await new Promise((r) => setTimeout(r, 5));
    await post('forgot', { email: user.email });
    await post('reset', { token: first, password: 'NouveauMotdepasse1' }).expect(410);
  });

  it('applies the password rules', async () => {
    const res = await post('reset', { token: 'x'.repeat(20), password: 'court' }).expect(422);
    expect(res.body.details[0]).toMatchObject({ field: 'password', message: 'Au moins 12 caractères.' });
  });

  it('unlocks a locked account', async () => {
    const user = await createUser(t.dataSource, { lockedUntil: new Date(Date.now() + 600_000) });
    await post('forgot', { email: user.email });
    await post('reset', { token: await tokenFromLastEmail(user.email), password: 'NouveauMotdepasse1' }).expect(200);
    await request(t.http).post('/api/v1/auth/login').send({ email: user.email, password: 'NouveauMotdepasse1' }).expect(200);
  });
});
