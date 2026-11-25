import request from 'supertest';

import { AuditLog, Member, MembershipRequest, Notification } from '../../src/database/entities';
import { createTestApp, type TestApp } from '../setup/app';
import { as, loginAs, type SignedIn } from '../setup/auth';

const form = (overrides: Record<string, unknown> = {}) => ({
  firstName: 'Lucie',
  lastName: 'Gagnon',
  email: `lucie.${Math.random().toString(36).slice(2, 8)}@exemple.ca`,
  phone: '514 555-0101',
  address: '45, rue Fleury Est\nMontréal (Québec)',
  birthDate: '1955-04-18',
  sex: 'FEMALE',
  ageCategory: '65_74',
  birthdayWishesConsent: true,
  newsletterConsent: false,
  turnstileToken: 'dev-token',
  ...overrides,
});

describe('POST /memberships (B3-01)', () => {
  let t: TestApp;
  let admin: SignedIn;
  beforeAll(async () => {
    t = await createTestApp();
    admin = await loginAs(t, 'ADMIN');
  });
  afterAll(async () => {
    await as(t, admin).put('/settings/membership').send({ autoApprove: false });
    await t.app.close();
  });

  it('records a pending request without an account, queues the acknowledgement and audits it', async () => {
    const body = form();
    const res = await request(t.http).post('/api/v1/memberships').send(body).expect(201);
    expect(res.body).toEqual({ id: expect.any(String), status: 'PENDING' });
    const saved = await t.dataSource.getRepository(MembershipRequest).findOneByOrFail({ id: res.body.id });
    expect(saved).toMatchObject({
      email: body.email,
      sex: 'FEMALE',
      birthdayWishesConsent: true,
      memberId: null,
    });
    const mail = await t.dataSource
      .getRepository(Notification)
      .findOneByOrFail({ uniqueKey: `membership-received:${res.body.id}` });
    expect(mail).toMatchObject({ type: 'MEMBERSHIP_RECEIVED', recipient: body.email });
    expect(
      await t.dataSource
        .getRepository(AuditLog)
        .countBy({ action: 'MEMBERSHIP_SUBMITTED', entityId: res.body.id }),
    ).toBe(1);
  });

  it('requires the sex, Masculin or Féminin only', async () => {
    const { sex: _sex, ...withoutSex } = form();
    const res = await request(t.http).post('/api/v1/memberships').send(withoutSex).expect(422);
    expect(res.body.details).toEqual([expect.objectContaining({ field: 'sex' })]);
    await request(t.http)
      .post('/api/v1/memberships')
      .send(form({ sex: 'MALE' }))
      .expect(201);
  });

  it('requires the phone, the postal address and the birth date', async () => {
    const { phone: _p, address: _a, birthDate: _b, ...rest } = form();
    const missing = await request(t.http).post('/api/v1/memberships').send(rest).expect(422);
    expect(missing.body.details.map((d: { field: string }) => d.field).sort()).toEqual([
      'address',
      'birthDate',
      'phone',
    ]);
    const blank = await request(t.http)
      .post('/api/v1/memberships')
      .send(form({ phone: '  ', address: '', birthDate: '' }))
      .expect(422);
    expect(blank.body.details.map((d: { field: string }) => d.field).sort()).toEqual([
      'address',
      'birthDate',
      'phone',
    ]);
    const badPhone = await request(t.http)
      .post('/api/v1/memberships')
      .send(form({ phone: '555-01' }))
      .expect(422);
    expect(badPhone.body.details).toEqual([expect.objectContaining({ field: 'phone' })]);
  });

  it('requires the anti-robot token', async () => {
    const res = await request(t.http)
      .post('/api/v1/memberships')
      .send(form({ turnstileToken: '' }))
      .expect(422);
    expect(res.body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'turnstileToken' })]),
    );
  });

  it('validates the fields with French messages', async () => {
    const res = await request(t.http)
      .post('/api/v1/memberships')
      .send(
        form({
          firstName: '',
          email: 'pas-un-courriel',
          sex: 'AUTRE',
          ageCategory: 'X',
          birthDate: '2999-01-01',
        }),
      )
      .expect(422);
    const fields = res.body.details.map((d: { field: string }) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['firstName', 'email', 'sex', 'ageCategory', 'birthDate']));
  });

  it('refuses an address that already belongs to a member', async () => {
    const body = form();
    await as(t, admin).put('/settings/membership').send({ autoApprove: true });
    await request(t.http).post('/api/v1/memberships').send(body).expect(201);
    await as(t, admin).put('/settings/membership').send({ autoApprove: false });
    const res = await request(t.http)
      .post('/api/v1/memberships')
      .send({ ...body, email: body.email.toUpperCase() })
      .expect(409);
    expect(res.body).toMatchObject({ code: 'ALREADY_MEMBER', details: [{ field: 'email' }] });
  });

  it('approves at once when automatic approval is on, with member and consents', async () => {
    await as(t, admin).put('/settings/membership').send({ autoApprove: true });
    const body = form({ newsletterConsent: true });
    const res = await request(t.http).post('/api/v1/memberships').send(body).expect(201);
    expect(res.body.status).toBe('APPROVED');
    const saved = await t.dataSource.getRepository(MembershipRequest).findOneByOrFail({ id: res.body.id });
    expect(saved).toMatchObject({ decidedAutomatically: true, decidedById: null });
    const member = await t.dataSource
      .getRepository(Member)
      .findOneOrFail({ where: { id: saved.memberId! }, relations: { consents: true } });
    expect(member.memberNumber).toMatch(/^M-\d+/);
    expect(member.sex).toBe('FEMALE');
    expect(member.consents!.map((c) => c.type).sort()).toEqual(['BIRTHDAY_WISHES', 'NEWSLETTER']);
    expect(
      await t.dataSource
        .getRepository(Notification)
        .countBy({ uniqueKey: `membership-approved:${res.body.id}` }),
    ).toBe(1);
  });
});
