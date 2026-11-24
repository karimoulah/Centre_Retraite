import request from 'supertest';

import { Entry, Notification, Payment, WebhookEvent } from '../../src/database/entities';
import { createTestApp, type TestApp } from '../setup/app';
import { postWebhook, stripeEvent } from '../setup/stripe';

/** US-24 / ENF-03: the same webhook replayed 10 times gives 1 transaction and 1 entry (report, problématique 2). */
describe('Webhook replayed 10 times (B7-06)', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(() => t.app.close());

  const donation = async () => {
    const email = `rejeu.${Date.now()}.${Math.random().toString(36).slice(2, 6)}@exemple.ca`;
    await request(t.http).post('/api/v1/donations/checkout').send({ amountCents: 4200, donorName: 'Réjean Poirier', donorEmail: email, turnstileToken: 'dev' }).expect(201);
    const payment = await t.dataSource.getRepository(Payment).findOneByOrFail({ donorEmail: email });
    const event = stripeEvent('checkout.session.completed', {
      id: payment.checkoutSessionId,
      payment_status: 'paid',
      amount_total: 4200,
      metadata: { paymentId: payment.id },
      payment_intent: `pi_replay_${payment.id.slice(0, 8)}`,
    });
    return { payment, event };
  };
  const counts = async (payment: Payment) => {
    const confirmed = await t.dataSource.getRepository(Payment).findOneByOrFail({ id: payment.id });
    return {
      status: confirmed.status,
      events: await t.dataSource.getRepository(WebhookEvent).countBy({ paymentId: payment.id }),
      entries: confirmed.contributorId ? await t.dataSource.getRepository(Entry).countBy({ contributorId: confirmed.contributorId }) : 0,
      emails: await t.dataSource.getRepository(Notification).countBy({ uniqueKey: `donation-confirmed:${payment.id}` }),
    };
  };

  it('one after the other: 10 deliveries → 1 confirmed payment, 1 entry, 1 e-mail', async () => {
    const { payment, event } = await donation();
    const statuses: number[] = [];
    for (let i = 0; i < 10; i += 1) statuses.push((await postWebhook(t, event)).status);
    expect(statuses).toEqual(Array(10).fill(200));
    expect(await counts(payment)).toEqual({ status: 'CONFIRMED', events: 1, entries: 1, emails: 1 });
  });

  it('all at once: 10 simultaneous deliveries → still 1 of each', async () => {
    const { payment, event } = await donation();
    const results = await Promise.all(Array.from({ length: 10 }, () => postWebhook(t, event)));
    expect(results.map((r) => r.status)).toEqual(Array(10).fill(200));
    expect(results.filter((r) => r.body.duplicate).length).toBe(9);
    expect(await counts(payment)).toEqual({ status: 'CONFIRMED', events: 1, entries: 1, emails: 1 });
  });

  it('10 different events about the same payment → still 1 entry', async () => {
    const { payment, event } = await donation();
    for (let i = 0; i < 10; i += 1) await postWebhook(t, { ...event, id: `${event.id}_${i}` }).expect(200);
    const result = await counts(payment);
    expect({ entries: result.entries, emails: result.emails, status: result.status }).toEqual({ entries: 1, emails: 1, status: 'CONFIRMED' });
  });
});
