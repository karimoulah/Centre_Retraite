import Stripe from 'stripe';

import { loadEnv } from '../../config/config';
import { StripeProvider } from './stripe-provider';

const env = loadEnv({
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
  PAYMENTS_DRIVER: 'stripe',
  STRIPE_SECRET_KEY: 'sk_test_unit',
  STRIPE_WEBHOOK_SECRET: 'whsec_unit',
});

describe('StripeProvider.verifyWebhook', () => {
  const provider = new StripeProvider(env);
  const payload = JSON.stringify({ id: 'evt_1', object: 'event', type: 'checkout.session.completed', data: { object: {} } });
  const sign = (secret: string) => new Stripe('sk_test_unit').webhooks.generateTestHeaderString({ payload, secret });

  it('accepts an event signed with the endpoint secret', () => {
    expect(provider.verifyWebhook(Buffer.from(payload), sign('whsec_unit')).id).toBe('evt_1');
  });

  it('refuses a missing, forged or altered signature', () => {
    expect(() => provider.verifyWebhook(Buffer.from(payload), undefined)).toThrow();
    expect(() => provider.verifyWebhook(Buffer.from(payload), sign('whsec_other'))).toThrow();
    expect(() => provider.verifyWebhook(Buffer.from(payload.replace('evt_1', 'evt_2')), sign('whsec_unit'))).toThrow();
  });
});
