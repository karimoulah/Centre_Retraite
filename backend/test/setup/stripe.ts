import request from 'supertest';

import type { FakeProvider } from '../../src/modules/donations/fake-provider';
import { PaymentProvider } from '../../src/modules/donations/payment-provider';
import type { TestApp } from './app';

let n = 0;
/** A Stripe-shaped event, signed like Stripe would, posted to the real webhook endpoint. */
export function stripeEvent(type: string, object: Record<string, unknown>, id = `evt_test_${Date.now()}_${(n += 1)}`) {
  return { id, object: 'event', type, created: Math.floor(Date.now() / 1000), livemode: false, data: { object } };
}

export function postWebhook(t: TestApp, event: object, signature?: string) {
  const payload = JSON.stringify(event);
  const provider = t.app.get(PaymentProvider) as FakeProvider;
  return request(t.http)
    .post('/api/v1/webhooks/stripe')
    .set('content-type', 'application/json')
    .set('stripe-signature', signature ?? provider.sign(payload))
    .send(payload);
}
