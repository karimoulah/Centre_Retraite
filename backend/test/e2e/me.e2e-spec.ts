import { AuditLog, Consent } from '../../src/database/entities';
import { createMember } from '../factories/members';
import { createTestApp, type TestApp } from '../setup/app';
import { as, loginAs, type SignedIn } from '../setup/auth';

describe('/me/profile and /me/consents (B4-02)', () => {
  let t: TestApp;
  let me: SignedIn;
  let memberId: string;
  beforeAll(async () => {
    t = await createTestApp();
    const member = await createMember(t.dataSource, { phone: '514 555-0000' }, ['NEWSLETTER']);
    memberId = member.id;
    me = await loginAs(t, 'MEMBER', { email: member.email, memberId });
  });
  afterAll(() => t.app.close());

  it('shows my own record', async () => {
    const res = await as(t, me).get('/me/profile').expect(200);
    expect(res.body).toMatchObject({ id: memberId, phone: '514 555-0000', consents: { newsletter: { granted: true } } });
  });

  it('lets me change only my phone and address', async () => {
    const res = await as(t, me).patch('/me/profile').send({ phone: '438 555-0123', address: '12 rue des Érables, Laval' }).expect(200);
    expect(res.body).toMatchObject({ phone: '438 555-0123', address: '12 rue des Érables, Laval' });
    const blank = await as(t, me).patch('/me/profile').send({ phone: '', address: '' }).expect(422);
    expect(blank.body.details.map((d: { field: string }) => d.field).sort()).toEqual(['address', 'phone']);
    await as(t, me).patch('/me/profile').send({ email: 'autre@exemple.ca' }).expect(422);
    const audit = await t.dataSource.getRepository(AuditLog).findOneByOrFail({ action: 'PROFILE_UPDATED', entityId: memberId });
    expect(audit.actorId).toBe(me.user.id);
  });

  it('records each consent change as a dated row and keeps one active row', async () => {
    const off = await as(t, me).put('/me/consents').send({ newsletter: false, birthdayWishes: true }).expect(200);
    expect(off.body).toMatchObject({ newsletter: { granted: false, updatedAt: expect.any(String) }, birthdayWishes: { granted: true } });
    await as(t, me).put('/me/consents').send({ newsletter: true }).expect(200);
    await as(t, me).put('/me/consents').send({ newsletter: true }).expect(200);

    const rows = await t.dataSource.getRepository(Consent).findBy({ memberId, type: 'NEWSLETTER' });
    expect(rows).toHaveLength(2);
    expect(rows.filter((r) => !r.withdrawnAt)).toHaveLength(1);
    const audits = await t.dataSource.getRepository(AuditLog).countBy({ action: 'CONSENTS_UPDATED', entityId: memberId });
    expect(audits).toBe(2);
    expect((await as(t, me).get('/me/consents').expect(200)).body.newsletter.granted).toBe(true);
  });

  it('answers NOT_A_MEMBER for a staff account', async () => {
    const staff = await loginAs(t, 'FINANCE');
    const res = await as(t, staff).get('/me/profile').expect(404);
    expect(res.body.code).toBe('NOT_A_MEMBER');
    await as(t, staff).put('/me/consents').send({ newsletter: true }).expect(404);
  });
});
