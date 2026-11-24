import { AuditLog, Member, Notification, User } from '../../src/database/entities';
import { createMembershipRequest } from '../factories/memberships';
import { createUser } from '../factories/users';
import { createTestApp, type TestApp } from '../setup/app';
import { as, loginAs, type SignedIn } from '../setup/auth';

describe('POST /memberships/:id/approve and /reject (B3-04)', () => {
  let t: TestApp;
  let admin: SignedIn;
  beforeAll(async () => {
    t = await createTestApp();
    admin = await loginAs(t, 'ADMIN', { firstName: 'Claire', lastName: 'Bouchard' });
  });
  afterAll(() => t.app.close());

  const mailFor = (id: string) => t.dataSource.getRepository(Notification).findOneBy({ uniqueKey: `membership-approved:${id}` });

  it('approves without a body: member, MEMBER account with invitation, welcome e-mail and audit', async () => {
    const req = await createMembershipRequest(t.dataSource, { newsletterConsent: true });
    const res = await as(t, admin).post(`/memberships/${req.id}/approve`).expect(200);
    expect(res.body).toMatchObject({ status: 'APPROVED', decidedBy: 'Claire Bouchard', memberId: expect.any(String) });

    const member = await t.dataSource.getRepository(Member).findOneByOrFail({ id: res.body.memberId });
    expect(member).toMatchObject({ email: req.email, active: true });
    const account = await t.dataSource.getRepository(User).findOneByOrFail({ memberId: member.id });
    expect(account.roles).toEqual(['MEMBER']);
    expect(account.invitationPending).toBe(true);

    const mail = await mailFor(req.id);
    expect(mail?.data).toMatchObject({ memberNumber: member.memberNumber, accountUrl: expect.stringContaining('/reset-password?token=') });
    const audit = await t.dataSource.getRepository(AuditLog).findOneByOrFail({ action: 'MEMBERSHIP_APPROVED', entityId: req.id });
    expect(audit.actorId).toBe(admin.user.id);
  });

  it('can approve without opening an account', async () => {
    const req = await createMembershipRequest(t.dataSource);
    const res = await as(t, admin).post(`/memberships/${req.id}/approve`).send({ createAccount: false }).expect(200);
    expect(await t.dataSource.getRepository(User).countBy({ memberId: res.body.memberId })).toBe(0);
    expect((await mailFor(req.id))?.data).toMatchObject({ accountUrl: null });
  });

  it('links an existing staff account instead of creating a second one', async () => {
    const staff = await createUser(t.dataSource, { roles: ['FINANCE'] });
    const req = await createMembershipRequest(t.dataSource, { email: staff.email });
    const res = await as(t, admin).post(`/memberships/${req.id}/approve`).expect(200);
    const account = await t.dataSource.getRepository(User).findOneByOrFail({ id: staff.id });
    expect(account).toMatchObject({ memberId: res.body.memberId });
    expect(account.roles).toEqual(['FINANCE', 'MEMBER']);
  });

  it('rejects with a reason and sends nothing', async () => {
    const req = await createMembershipRequest(t.dataSource);
    const res = await as(t, admin).post(`/memberships/${req.id}/reject`).send({ reason: 'Hors territoire desservi' }).expect(200);
    expect(res.body).toMatchObject({ status: 'REJECTED', rejectionReason: 'Hors territoire desservi', memberId: null });
    expect(await mailFor(req.id)).toBeNull();
  });

  it('requires a reason of at least 5 characters', async () => {
    const req = await createMembershipRequest(t.dataSource);
    const res = await as(t, admin).post(`/memberships/${req.id}/reject`).send({ reason: 'non' }).expect(422);
    expect(res.body.details).toEqual([expect.objectContaining({ field: 'reason' })]);
  });

  it('refuses a second decision with who decided first', async () => {
    const req = await createMembershipRequest(t.dataSource);
    await as(t, admin).post(`/memberships/${req.id}/approve`).expect(200);
    const res = await as(t, admin).post(`/memberships/${req.id}/reject`).send({ reason: 'Trop tard ici' }).expect(409);
    expect(res.body).toMatchObject({ code: 'ALREADY_DECIDED' });
    expect(res.body.message).toContain('Claire Bouchard');
  });

  it('decides only once when two administrators click at the same time', async () => {
    const req = await createMembershipRequest(t.dataSource);
    const other = await loginAs(t, 'ADMIN');
    const results = await Promise.all([
      as(t, admin).post(`/memberships/${req.id}/approve`),
      as(t, other).post(`/memberships/${req.id}/approve`),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(await t.dataSource.getRepository(Member).countBy({ email: req.email })).toBe(1);
  });
});
