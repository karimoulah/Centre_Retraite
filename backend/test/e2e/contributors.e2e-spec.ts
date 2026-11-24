import { Tx } from '../../src/common/transaction/transaction.service';
import { ContributorsService } from '../../src/modules/finance/contributors';
import { createMember } from '../factories/members';
import { createTestApp, type TestApp } from '../setup/app';
import { as, loginAs, type SignedIn } from '../setup/auth';

describe('/contributors (B6-02)', () => {
  let t: TestApp;
  let finance: SignedIn;
  beforeAll(async () => {
    t = await createTestApp();
    finance = await loginAs(t, 'FINANCE');
  });
  afterAll(() => t.app.close());

  it('creates a contributor linked to a member and finds it by name or e-mail', async () => {
    const member = await createMember(t.dataSource, { firstName: 'Odette', lastName: 'Vachon' });
    const res = await as(t, finance)
      .post('/contributors')
      .send({ name: 'Odette Vachon', email: 'ODETTE.vachon@exemple.ca', memberId: member.id, phone: '' })
      .expect(201);
    expect(res.body).toMatchObject({ kind: 'INDIVIDUAL', email: 'odette.vachon@exemple.ca', phone: null, member: { id: member.id, memberNumber: member.memberNumber } });
    for (const q of ['vachon', 'odette.vachon@']) {
      const found = await as(t, finance).get('/contributors').query({ q }).expect(200);
      expect(found.body.items.map((c: { id: string }) => c.id)).toContain(res.body.id);
    }
  });

  it('accepts an organization without e-mail and refuses a duplicate e-mail', async () => {
    await as(t, finance).post('/contributors').send({ kind: 'ORGANIZATION', name: 'Caisse populaire du quartier' }).expect(201);
    await as(t, finance).post('/contributors').send({ name: 'Un', email: 'double@exemple.ca' }).expect(201);
    const dup = await as(t, finance).post('/contributors').send({ name: 'Deux', email: 'DOUBLE@exemple.ca' }).expect(409);
    expect(dup.body).toMatchObject({ code: 'EMAIL_TAKEN', details: [{ field: 'email' }] });
  });

  it('updates a contributor and refuses an unknown member', async () => {
    const created = await as(t, finance).post('/contributors').send({ name: 'Henri Roy' }).expect(201);
    const res = await as(t, finance).patch(`/contributors/${created.body.id}`).send({ notes: 'Préfère le chèque' }).expect(200);
    expect(res.body.notes).toBe('Préfère le chèque');
    await as(t, finance).patch(`/contributors/${created.body.id}`).send({ memberId: '00000000-0000-4000-8000-000000000000' }).expect(404);
  });

  it('online donations reuse the contributor of the same e-mail, or create one linked to the member', async () => {
    const service = t.app.get(ContributorsService);
    const tx = t.app.get(Tx);
    const member = await createMember(t.dataSource);
    const first = await tx.run(() => service.findOrCreateByEmail(member.email.toUpperCase(), 'Nom du paiement'));
    const again = await tx.run(() => service.findOrCreateByEmail(member.email, 'Autre nom'));
    expect(again.id).toBe(first.id);
    expect(first.memberId).toBe(member.id);
  });

  it('is reserved to the finance role', async () => {
    await as(t, await loginAs(t, 'MEMBER')).get('/contributors').expect(403);
  });
});
