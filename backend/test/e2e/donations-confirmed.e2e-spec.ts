import request from 'supertest';

import { AuditLog, Contributor, Entry, Notification, Payment } from '../../src/database/entities';
import { createMember } from '../factories/members';
import { createTestApp, type TestApp } from '../setup/app';
import { postWebhook, stripeEvent } from '../setup/stripe';

describe('Confirmed payment → validated entry (B7-03)', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(() => t.app.close());

  const startDonation = async (email = `don.${Date.now()}.${Math.random().toString(36).slice(2, 6)}@exemple.ca`, amountCents = 5000) => {
    await request(t.http).post('/api/v1/donations/checkout').send({ amountCents, donorName: 'Gaston Lefebvre', donorEmail: email, turnstileToken: 'dev' }).expect(201);
    return t.dataSource.getRepository(Payment).findOneByOrFail({ donorEmail: email });
  };
  const completed = (p: Payment, extra: Record<string, unknown> = {}) =>
    stripeEvent('checkout.session.completed', {
      id: p.checkoutSessionId,
      object: 'checkout.session',
      payment_status: 'paid',
      amount_total: p.amountCents,
      metadata: { paymentId: p.id },
      payment_intent: `pi_${p.id.slice(0, 8)}`,
      ...extra,
    });

  it('confirms the payment, finds or creates the contributor, creates a validated donation entry and queues the e-mail', async () => {
    const member = await createMember(t.dataSource);
    const payment = await startDonation(member.email);
    await postWebhook(t, completed(payment)).expect(200);

    const confirmed = await t.dataSource.getRepository(Payment).findOneByOrFail({ id: payment.id });
    expect(confirmed).toMatchObject({ status: 'CONFIRMED', paymentIntentId: `pi_${payment.id.slice(0, 8)}`, entryId: expect.any(String) });
    const entry = await t.dataSource.getRepository(Entry).findOneOrFail({ where: { id: confirmed.entryId! }, relations: { category: true } });
    expect(entry).toMatchObject({ status: 'VALIDATED', direction: 'INCOME', amountCents: 5000, source: 'ONLINE', paymentMethod: 'ONLINE', validatedById: null });
    expect(entry.category?.code).toBe('DONATION');
    const contributor = await t.dataSource.getRepository(Contributor).findOneByOrFail({ id: confirmed.contributorId! });
    expect(contributor).toMatchObject({ email: member.email.toLowerCase(), memberId: member.id });
    const mail = await t.dataSource.getRepository(Notification).findOneByOrFail({ uniqueKey: `donation-confirmed:${payment.id}` });
    expect(mail).toMatchObject({ type: 'DONATION_CONFIRMED', recipient: payment.donorEmail, data: { amountCents: 5000, reference: entry.reference } });
    expect(await t.dataSource.getRepository(AuditLog).countBy({ action: 'PAYMENT_CONFIRMED', entityId: payment.id })).toBe(1);

    const status = await request(t.http).get(`/api/v1/donations/sessions/${payment.checkoutSessionId}`).expect(200);
    expect(status.body.status).toBe('CONFIRMED');
  });

  it('a second confirmation event of the same payment changes nothing', async () => {
    const payment = await startDonation();
    await postWebhook(t, completed(payment)).expect(200);
    await postWebhook(t, stripeEvent('checkout.session.async_payment_succeeded', { id: payment.checkoutSessionId, metadata: { paymentId: payment.id }, amount_total: 5000 })).expect(200);
    expect(await t.dataSource.getRepository(Entry).countBy({ contributorId: (await t.dataSource.getRepository(Payment).findOneByOrFail({ id: payment.id })).contributorId! })).toBe(1);
  });

  it('waits for delayed methods, and records failure or expiry without any entry', async () => {
    const delayed = await startDonation();
    await postWebhook(t, completed(delayed, { payment_status: 'unpaid' })).expect(200);
    expect((await t.dataSource.getRepository(Payment).findOneByOrFail({ id: delayed.id })).status).toBe('PENDING');
    await postWebhook(t, stripeEvent('checkout.session.async_payment_failed', { id: delayed.checkoutSessionId, metadata: { paymentId: delayed.id } })).expect(200);
    expect(await t.dataSource.getRepository(Payment).findOneByOrFail({ id: delayed.id })).toMatchObject({ status: 'FAILED', entryId: null });

    const abandoned = await startDonation();
    await postWebhook(t, stripeEvent('checkout.session.expired', { id: abandoned.checkoutSessionId, metadata: { paymentId: abandoned.id } })).expect(200);
    expect((await t.dataSource.getRepository(Payment).findOneByOrFail({ id: abandoned.id })).status).toBe('EXPIRED');
  });

  it('a full refund reverses the donation entry once; a partial refund is only recorded', async () => {
    const payment = await startDonation(undefined, 8000);
    await postWebhook(t, completed(payment)).expect(200);
    const intent = `pi_${payment.id.slice(0, 8)}`;
    await postWebhook(t, stripeEvent('charge.refunded', { id: 'ch_1', payment_intent: intent, amount: 8000, amount_refunded: 3000 })).expect(200);
    expect((await t.dataSource.getRepository(Payment).findOneByOrFail({ id: payment.id })).status).toBe('CONFIRMED');
    expect(await t.dataSource.getRepository(AuditLog).countBy({ action: 'PAYMENT_PARTIALLY_REFUNDED', entityId: payment.id })).toBe(1);

    await postWebhook(t, stripeEvent('charge.refunded', { id: 'ch_1', payment_intent: intent, amount: 8000, amount_refunded: 8000 })).expect(200);
    await postWebhook(t, stripeEvent('charge.refunded', { id: 'ch_1', payment_intent: intent, amount: 8000, amount_refunded: 8000 })).expect(200);
    const refunded = await t.dataSource.getRepository(Payment).findOneByOrFail({ id: payment.id });
    expect(refunded).toMatchObject({ status: 'REFUNDED', refundEntryId: expect.any(String) });
    const reversal = await t.dataSource.getRepository(Entry).findOneByOrFail({ id: refunded.refundEntryId! });
    expect(reversal).toMatchObject({ amountCents: -8000, reversesId: refunded.entryId, status: 'VALIDATED' });
  });

  it('ignores an event about an unknown payment', async () => {
    await postWebhook(t, stripeEvent('checkout.session.completed', { id: 'cs_unknown', payment_status: 'paid', metadata: { paymentId: 'pas-un-uuid' } })).expect(200);
  });

  it('the local test payment page goes through the same pipeline', async () => {
    const res = await request(t.http)
      .post('/api/v1/donations/checkout')
      .send({ amountCents: 1500, donorName: 'Yvette <b>Côté</b>', donorEmail: `yvette.${Date.now()}@exemple.ca`, turnstileToken: 'dev' })
      .expect(201);
    const path = new URL(res.body.url).pathname;
    const page = await request(t.http).get(path).expect(200);
    expect(page.text).toContain('15,00');
    expect(page.text).not.toContain('<b>Côté</b>');
    const paid = await request(t.http).post(`${path}/pay`).set('Origin', 'http://localhost:3000').expect(303);
    expect(paid.headers.location).toMatch(/\/donate\/thank-you\?session_id=cs_fake_/);
    const sessionId = path.split('/').pop()!;
    expect((await t.dataSource.getRepository(Payment).findOneByOrFail({ checkoutSessionId: sessionId })).status).toBe('CONFIRMED');
    await request(t.http).post(`${path}/pay`).expect(404);
  });
});
