import request from 'supertest';

import { AuditLog, Payment } from '../../src/database/entities';
import { PaymentProvider } from '../../src/modules/donations/payment-provider';
import { createTestApp, type TestApp } from '../setup/app';

const gift = (overrides: Record<string, unknown> = {}) => ({
  amountCents: 2500,
  donorName: 'Louise Caron',
  donorEmail: `louise.${Date.now()}@exemple.ca`,
  turnstileToken: 'dev-token',
  ...overrides,
});

describe('POST /donations/checkout (B7-01)', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(() => t.app.close());

  it('creates a PENDING payment and returns the provider page; no card data reaches the API', async () => {
    const body = gift();
    const res = await request(t.http).post('/api/v1/donations/checkout').send(body).expect(201);
    expect(res.body).toEqual({ url: expect.stringMatching(/\/dev\/checkout\/cs_fake_\w+$/) });
    const payment = await t.dataSource.getRepository(Payment).findOneByOrFail({ donorEmail: body.donorEmail });
    expect(payment).toMatchObject({ status: 'PENDING', amountCents: 2500, currency: 'CAD', checkoutSessionId: expect.stringMatching(/^cs_fake_/), entryId: null });
    expect(Object.keys(payment).some((k) => /card|cvc|pan/i.test(k))).toBe(false);
    expect(await t.dataSource.getRepository(AuditLog).countBy({ action: 'DONATION_STARTED', entityId: payment.id })).toBe(1);

    const status = await request(t.http).get(`/api/v1/donations/sessions/${payment.checkoutSessionId}`).expect(200);
    expect(status.body).toEqual({ status: 'PENDING', amountCents: 2500 });
  });

  it('requires at least 5 $, a name, a valid e-mail and the anti-robot token', async () => {
    const res = await request(t.http)
      .post('/api/v1/donations/checkout')
      .send(gift({ amountCents: 499, donorName: '', donorEmail: 'x', turnstileToken: '' }))
      .expect(422);
    expect(res.body.details.map((d: { field: string }) => d.field)).toEqual(
      expect.arrayContaining(['amountCents', 'donorName', 'donorEmail', 'turnstileToken']),
    );
  });

  it('keeps nothing when the provider is unreachable', async () => {
    const provider = t.app.get(PaymentProvider);
    jest.spyOn(provider, 'createCheckout').mockRejectedValueOnce(new Error('ECONNRESET'));
    const body = gift();
    const res = await request(t.http).post('/api/v1/donations/checkout').send(body).expect(502);
    expect(res.body.code).toBe('PAYMENT_PROVIDER_ERROR');
    expect(await t.dataSource.getRepository(Payment).countBy({ donorEmail: body.donorEmail })).toBe(0);
  });

  it('answers 404 for an unknown session', async () => {
    await request(t.http).get('/api/v1/donations/sessions/cs_inconnu').expect(404);
  });
});
