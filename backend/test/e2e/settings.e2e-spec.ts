import { AuditLog } from '../../src/database/entities';
import { createTestApp, type TestApp } from '../setup/app';
import { as, loginAs, type SignedIn } from '../setup/auth';

describe('GET/PUT /settings/membership (B3-06)', () => {
  let t: TestApp;
  let admin: SignedIn;
  beforeAll(async () => {
    t = await createTestApp();
    admin = await loginAs(t, 'ADMIN', { firstName: 'Claire', lastName: 'Bouchard' });
  });
  afterAll(async () => {
    await as(t, admin).put('/settings/membership').send({ autoApprove: false });
    await t.app.close();
  });

  it('is off by default', async () => {
    const res = await as(t, admin).get('/settings/membership').expect(200);
    expect(res.body.autoApprove).toBe(false);
  });

  it('stores the switch with its author and records the change', async () => {
    const res = await as(t, admin).put('/settings/membership').send({ autoApprove: true }).expect(200);
    expect(res.body).toMatchObject({ autoApprove: true, updatedBy: 'Claire Bouchard' });
    expect(res.body.updatedAt).toBeTruthy();
    const audit = await t.dataSource
      .getRepository(AuditLog)
      .findOneOrFail({ where: { action: 'SETTINGS_UPDATED', entityId: 'membership' }, order: { id: 'DESC' } });
    expect(audit).toMatchObject({ before: { autoApprove: false }, after: { autoApprove: true }, actorId: admin.user.id });
  });

  it('refuses a value that is not a boolean', async () => {
    await as(t, admin).put('/settings/membership').send({ autoApprove: 'oui' }).expect(422);
  });

  it('is reserved to administrators', async () => {
    await as(t, await loginAs(t, 'FINANCE')).get('/settings/membership').expect(403);
  });
});
