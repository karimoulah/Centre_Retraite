import { AuditLog, Notification, User } from '../../src/database/entities';
import { createTestApp, type TestApp } from '../setup/app';
import { as, loginAs, type SignedIn } from '../setup/auth';
import { createUser } from '../factories/users';

describe('Users (B1-06)', () => {
  let t: TestApp;
  let admin: SignedIn;
  beforeAll(async () => {
    t = await createTestApp();
    admin = await loginAs(t, 'ADMIN', { firstName: 'Aminata', lastName: 'Diallo' });
  });
  afterAll(() => t.app.close());

  it('creates an account without password and queues an invitation e-mail', async () => {
    const res = await as(t, admin)
      .post('/users')
      .send({ email: 'Nouvelle.Personne@Test.local', firstName: 'Nouvelle', lastName: 'Personne', roles: ['FINANCE'] })
      .expect(201);
    expect(res.body).toMatchObject({ email: 'nouvelle.personne@test.local', roles: ['FINANCE'], active: true, invitationPending: true });
    const invitation = await t.dataSource.getRepository(Notification).findOneByOrFail({ recipient: 'nouvelle.personne@test.local' });
    expect(invitation.type).toBe('USER_INVITATION');
    expect(String(invitation.data.url)).toMatch(/\/reset-password\?token=/);
    const audit = await t.dataSource.getRepository(AuditLog).findOneByOrFail({ entityId: res.body.id, action: 'USER_CREATED' });
    expect(audit.actorId).toBe(admin.user.id);
  });

  it('refuses a second account with the same e-mail, whatever the case', async () => {
    const existing = await createUser(t.dataSource);
    const res = await as(t, admin)
      .post('/users')
      .send({ email: existing.email.toUpperCase(), firstName: 'A', lastName: 'B', roles: ['ADMIN'] })
      .expect(409);
    expect(res.body).toMatchObject({ code: 'EMAIL_TAKEN', details: [{ field: 'email' }] });
  });

  it('requires at least one role', async () => {
    const res = await as(t, admin).post('/users').send({ email: 'x@test.local', firstName: 'A', lastName: 'B', roles: [] }).expect(422);
    expect(res.body.details[0]).toEqual({ field: 'roles', message: 'Choisissez au moins un rôle.' });
  });

  it('lists with search, role and status filters', async () => {
    await createUser(t.dataSource, { lastName: 'Zzrecherche', roles: ['TESTIMONIALS'] });
    const res = await as(t, admin).get('/users?q=zzrech&role=TESTIMONIALS&status=active').expect(200);
    expect(res.body).toMatchObject({ total: 1, page: 1, pageSize: 25 });
    expect(res.body.items[0]).toMatchObject({ lastName: 'Zzrecherche', roles: ['TESTIMONIALS'], invitationPending: false });
    const pending = await as(t, admin).get('/users?status=pending').expect(200);
    expect(pending.body.items.every((u: { invitationPending: boolean }) => u.invitationPending)).toBe(true);
  });

  it('updates the names and records before and after', async () => {
    const user = await createUser(t.dataSource);
    const res = await as(t, admin).patch(`/users/${user.id}`).send({ firstName: 'Renommé' }).expect(200);
    expect(res.body.firstName).toBe('Renommé');
    const audit = await t.dataSource.getRepository(AuditLog).findOneByOrFail({ entityId: user.id, action: 'USER_UPDATED' });
    expect(audit).toMatchObject({ before: { firstName: 'Test' }, after: { firstName: 'Renommé' } });
  });

  it('deactivates (never deletes) and ends the sessions of the account', async () => {
    const target = await loginAs(t, 'FINANCE');
    await as(t, admin).post(`/users/${target.user.id}/deactivate`).expect(200);
    await as(t, target).get('/auth/me').expect(401);
    expect(await t.dataSource.getRepository(User).findOneBy({ id: target.user.id })).toMatchObject({ active: false });
    await as(t, admin).post(`/users/${target.user.id}/deactivate`).expect(409);
  });

  it('an administrator cannot deactivate their own account', async () => {
    const res = await as(t, admin).post(`/users/${admin.user.id}/deactivate`).expect(409);
    expect(res.body.code).toBe('CANNOT_DEACTIVATE_SELF');
  });

  it('answers 404 for an unknown or malformed id', async () => {
    await as(t, admin).get('/users/00000000-0000-4000-8000-000000000000').expect(404);
    await as(t, admin).get('/users/abc').expect(404);
  });

  it('is reserved to administrators', async () => {
    const finance = await loginAs(t, 'FINANCE');
    await as(t, finance).get('/users').expect(403);
  });

  it('an invited person chooses a password with the invitation link', async () => {
    await as(t, admin).post('/users').send({ email: 'invite@test.local', firstName: 'In', lastName: 'Vité', roles: ['MEMBER'] }).expect(201);
    const invitation = await t.dataSource.getRepository(Notification).findOneByOrFail({ recipient: 'invite@test.local' });
    const token = new URL(String(invitation.data.url)).searchParams.get('token');
    const request = (await import('supertest')).default;
    await request(t.http).post('/api/v1/auth/password/reset').send({ token, password: 'MonMotdepasse12' }).expect(200);
    await request(t.http).post('/api/v1/auth/login').send({ email: 'invite@test.local', password: 'MonMotdepasse12' }).expect(200);
  });
});
