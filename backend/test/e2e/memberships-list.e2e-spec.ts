import request from 'supertest';

import { createMembershipRequest } from '../factories/memberships';
import { createTestApp, type TestApp } from '../setup/app';
import { as, loginAs, type SignedIn } from '../setup/auth';

describe('GET /memberships and /memberships/:id (B3-02)', () => {
  let t: TestApp;
  let admin: SignedIn;
  beforeAll(async () => {
    t = await createTestApp();
    admin = await loginAs(t, 'ADMIN');
  });
  afterAll(() => t.app.close());

  it('lists the requests newest first, filtered by status and searchable', async () => {
    const older = await createMembershipRequest(t.dataSource, { lastName: 'Zzancien', submittedAt: new Date('2026-01-01') });
    const newer = await createMembershipRequest(t.dataSource, { lastName: 'Zzrecent' });
    await createMembershipRequest(t.dataSource, { lastName: 'Zzrefuse', status: 'REJECTED', decidedAt: new Date(), rejectionReason: 'Hors territoire' });

    const res = await as(t, admin).get('/memberships').query({ status: 'PENDING', q: 'zz' }).expect(200);
    expect(res.body.items.map((r: { id: string }) => r.id)).toEqual([newer.id, older.id]);
    expect(res.body).toMatchObject({ total: 2, page: 1 });
    expect(res.body.items[0]).toMatchObject({ status: 'PENDING', name: `Zzrecent ${newer.firstName}`, decidedBy: null });
  });

  it('refuses an unknown status', async () => {
    await as(t, admin).get('/memberships').query({ status: 'MAYBE' }).expect(422);
  });

  it('shows one request with its history', async () => {
    const created = await request(t.http)
      .post('/api/v1/memberships')
      .send({ firstName: 'Rose', lastName: 'Dion', email: `rose.${Date.now()}@exemple.ca`, sex: 'FEMALE', ageCategory: '75_84', turnstileToken: 'dev' })
      .expect(201);
    const res = await as(t, admin).get(`/memberships/${created.body.id}`).expect(200);
    expect(res.body).toMatchObject({ id: created.body.id, firstName: 'Rose', sex: 'FEMALE', status: 'PENDING', birthDate: null });
    expect(res.body.history).toEqual([expect.objectContaining({ action: 'MEMBERSHIP_SUBMITTED', actor: null })]);
  });

  it('answers 404 for an unknown or malformed id', async () => {
    await as(t, admin).get('/memberships/00000000-0000-4000-8000-000000000000').expect(404);
    await as(t, admin).get('/memberships/abc').expect(404);
  });

  it('is reserved to administrators', async () => {
    await as(t, await loginAs(t, 'MEMBER')).get('/memberships').expect(403);
  });
});
