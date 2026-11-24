import { WebhookEvent } from '../../src/database/entities';
import { createTestApp, type TestApp } from '../setup/app';
import { postWebhook, stripeEvent } from '../setup/stripe';

describe('POST /webhooks/stripe (B7-02)', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(() => t.app.close());

  it('records a genuine event once; a replay is acknowledged and ignored', async () => {
    const event = stripeEvent('customer.created', { id: 'cus_1' });
    expect((await postWebhook(t, event).expect(200)).body).toEqual({ received: true });
    expect((await postWebhook(t, event).expect(200)).body).toEqual({ received: true, duplicate: true });
    expect(await t.dataSource.getRepository(WebhookEvent).countBy({ id: event.id })).toBe(1);
  });

  it('refuses an unsigned or forged call without recording anything', async () => {
    const event = stripeEvent('checkout.session.completed', { id: 'cs_x' });
    const res = await postWebhook(t, event, 't=1,v1=deadbeef').expect(400);
    expect(res.body.code).toBe('INVALID_SIGNATURE');
    await postWebhook(t, event, '').expect(400);
    expect(await t.dataSource.getRepository(WebhookEvent).countBy({ id: event.id })).toBe(0);
  });

  it('is not slowed down by the request limits nor blocked by the origin check', async () => {
    const results = await Promise.all(Array.from({ length: 8 }, () => postWebhook(t, stripeEvent('ping', {}))));
    expect(results.every((r) => r.status === 200)).toBe(true);
  });
});
