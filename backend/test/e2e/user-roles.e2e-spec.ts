import { AuditLog } from '../../src/database/entities';
import { createTestApp, type TestApp } from '../setup/app';
import { as, loginAs, type SignedIn } from '../setup/auth';
import { createUser } from '../factories/users';

describe('PUT /users/:id/roles (B1-07)', () => {
  let t: TestApp;
  let admin: SignedIn;
  beforeAll(async () => {
    t = await createTestApp();
    admin = await loginAs(t, 'ADMIN');
  });
  afterAll(() => t.app.close());

  it('replaces the list of roles and records the change', async () => {
    const user = await createUser(t.dataSource, { roles: ['ADMIN'] });
    const res = await as(t, admin).put(`/users/${user.id}/roles`).send({ roles: ['FINANCE', 'ADMIN', 'FINANCE'] }).expect(200);
    expect(res.body.roles).toEqual(['ADMIN', 'FINANCE']);
    const audit = await t.dataSource.getRepository(AuditLog).findOneByOrFail({ entityId: user.id, action: 'USER_ROLES_CHANGED' });
    expect(audit).toMatchObject({ before: { roles: ['ADMIN'] }, after: { roles: ['ADMIN', 'FINANCE'] }, actorId: admin.user.id });
  });

  it('the new roles apply at once', async () => {
    const finance = await loginAs(t, 'FINANCE');
    await as(t, finance).get('/users').expect(403);
    await as(t, admin).put(`/users/${finance.user.id}/roles`).send({ roles: ['ADMIN'] }).expect(200);
    await as(t, finance).get('/users').expect(200);
  });

  it('an administrator cannot remove their own ADMIN role', async () => {
    const res = await as(t, admin).put(`/users/${admin.user.id}/roles`).send({ roles: ['FINANCE'] }).expect(409);
    expect(res.body.code).toBe('CANNOT_REMOVE_OWN_ADMIN');
  });

  it('refuses an empty list or an unknown role', async () => {
    const user = await createUser(t.dataSource);
    await as(t, admin).put(`/users/${user.id}/roles`).send({ roles: [] }).expect(422);
    await as(t, admin).put(`/users/${user.id}/roles`).send({ roles: ['ROOT'] }).expect(422);
  });
});
