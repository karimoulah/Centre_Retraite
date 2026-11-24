import request from 'supertest';
import { IsNull } from 'typeorm';

import { AuditLog, Session, User } from '../../src/database/entities';
import { createMember } from '../factories/members';
import { createUser, TEST_PASSWORD } from '../factories/users';
import { createTestApp, type TestApp } from '../setup/app';
import { as, loginAs, type SignedIn } from '../setup/auth';

describe('/members (B4-01)', () => {
  let t: TestApp;
  let admin: SignedIn;
  beforeAll(async () => {
    t = await createTestApp();
    admin = await loginAs(t, 'ADMIN');
  });
  afterAll(() => t.app.close());

  it('lists members with filters, search on the member number and consents', async () => {
    const a = await createMember(t.dataSource, { lastName: 'Qqbeaulieu', ageCategory: '85_PLUS' }, ['NEWSLETTER']);
    await createMember(t.dataSource, { lastName: 'Qqcote', ageCategory: '85_PLUS', active: false });
    await createMember(t.dataSource, { lastName: 'Qqdube', ageCategory: '50_64' });

    const res = await as(t, admin).get('/members').query({ q: 'qq', status: 'active', ageCategory: '85_PLUS' }).expect(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0]).toMatchObject({
      id: a.id,
      memberNumber: expect.stringMatching(/^M-/),
      consents: { newsletter: { granted: true }, birthdayWishes: { granted: false, updatedAt: null } },
    });
    const byNumber = await as(t, admin).get('/members').query({ q: a.memberNumber }).expect(200);
    expect(byNumber.body.items.map((m: { id: string }) => m.id)).toEqual([a.id]);
  });

  it('corrects a member, records before/after and carries the e-mail to the account', async () => {
    const member = await createMember(t.dataSource);
    const account = await createUser(t.dataSource, { email: member.email, memberId: member.id, roles: ['MEMBER'] });
    const email = `nouveau.${Date.now()}@exemple.ca`;
    const res = await as(t, admin).patch(`/members/${member.id}`).send({ phone: '450 555-0199', email: email.toUpperCase() }).expect(200);
    expect(res.body).toMatchObject({ phone: '450 555-0199', email });
    expect((await t.dataSource.getRepository(User).findOneByOrFail({ id: account.id })).email).toBe(email);
    const audit = await t.dataSource.getRepository(AuditLog).findOneByOrFail({ action: 'MEMBER_UPDATED', entityId: member.id });
    expect(audit).toMatchObject({ before: { phone: null }, after: { phone: '450 555-0199' } });
  });

  it('refuses an e-mail already used by another member', async () => {
    const [a, b] = [await createMember(t.dataSource), await createMember(t.dataSource)];
    const res = await as(t, admin).patch(`/members/${a.id}`).send({ email: b.email }).expect(409);
    expect(res.body).toMatchObject({ code: 'EMAIL_TAKEN', details: [{ field: 'email' }] });
  });

  it('deactivates a member, closes the account and ends its sessions', async () => {
    const member = await createMember(t.dataSource);
    const account = await createUser(t.dataSource, { email: member.email, memberId: member.id, roles: ['MEMBER'] });
    const login = await request(t.http).post('/api/v1/auth/login').send({ email: account.email, password: TEST_PASSWORD }).expect(200);

    const res = await as(t, admin).post(`/members/${member.id}/deactivate`).expect(200);
    expect(res.body.active).toBe(false);
    expect(await t.dataSource.getRepository(Session).countBy({ userId: account.id, revokedAt: IsNull() })).toBe(0);
    await request(t.http).get('/api/v1/auth/me').set('Cookie', login.headers['set-cookie']).expect(401);
    const again = await as(t, admin).post(`/members/${member.id}/deactivate`).expect(409);
    expect(again.body.code).toBe('ALREADY_INACTIVE');
  });

  it('answers 404 and 403 where expected', async () => {
    await as(t, admin).get('/members/00000000-0000-4000-8000-000000000000').expect(404);
    await as(t, await loginAs(t, 'TESTIMONIALS')).get('/members').expect(403);
  });
});
