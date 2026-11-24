import { createMember } from '../factories/members';
import { createTestApp, type TestApp } from '../setup/app';
import { as, loginAs, type SignedIn } from '../setup/auth';

describe('GET /audit-logs (B13-04)', () => {
  let t: TestApp;
  let admin: SignedIn;
  let other: SignedIn;
  let memberId: string;
  beforeAll(async () => {
    t = await createTestApp();
    admin = await loginAs(t, 'ADMIN', { firstName: 'Claire', lastName: 'Bouchard' });
    other = await loginAs(t, 'ADMIN');
    memberId = (await createMember(t.dataSource)).id;
    await as(t, admin).patch(`/members/${memberId}`).send({ phone: '514 555-1111' }).expect(200);
    await as(t, other).patch(`/members/${memberId}`).send({ phone: '514 555-2222' }).expect(200);
  });
  afterAll(() => t.app.close());

  it('returns the newest lines first with the actor name and before/after', async () => {
    const res = await as(t, admin).get('/audit-logs').query({ entityType: 'Member', entityId: memberId }).expect(200);
    expect(res.body.total).toBe(2);
    expect(res.body.items[0]).toMatchObject({ actor: { id: other.user.id }, before: { phone: '514 555-1111' }, after: { phone: '514 555-2222' } });
    expect(res.body.items[1]).toMatchObject({ actor: { id: admin.user.id, name: 'Claire Bouchard' }, action: 'MEMBER_UPDATED', id: expect.any(String) });
  });

  it('filters by author and by day', async () => {
    const mine = await as(t, admin).get('/audit-logs').query({ actorId: admin.user.id, entityId: memberId }).expect(200);
    expect(mine.body.total).toBe(1);
    const alias = await as(t, admin).get('/audit-logs').query({ userId: admin.user.id, entityId: memberId }).expect(200);
    expect(alias.body.total).toBe(1);
    const past = await as(t, admin).get('/audit-logs').query({ entityId: memberId, from: '2020-01-01', to: '2020-12-31' }).expect(200);
    expect(past.body.total).toBe(0);
    await as(t, admin).get('/audit-logs').query({ from: '2026-05-01', to: '2026-04-01' }).expect(422);
  });

  it('is reserved to administrators', async () => {
    await as(t, await loginAs(t, 'FINANCE')).get('/audit-logs').expect(403);
  });
});
