import { randomUUID } from 'node:crypto';

import Stripe from 'stripe';

import type { Env } from '../../config/config.module';
import { type CheckoutRequest, type CheckoutSession, PaymentProvider, type ProviderEvent } from './payment-provider';

/**
 * Development and tests without Stripe keys: the "checkout page" is served by the API
 * (FakeCheckoutController) and events are signed exactly like Stripe's, with STRIPE_WEBHOOK_SECRET.
 */
export class FakeProvider extends PaymentProvider {
  readonly name = 'FAKE';
  private readonly stripe = new Stripe('sk_test_offline_signature_only');
  readonly sessions = new Map<string, CheckoutRequest>();

  constructor(private readonly env: Env) {
    super();
  }

  async createCheckout(r: CheckoutRequest): Promise<CheckoutSession> {
    const sessionId = `cs_fake_${randomUUID().replace(/-/g, '')}`;
    this.sessions.set(sessionId, r);
    return { sessionId, url: `${this.env.API_PUBLIC_URL.replace(/\/$/, '')}/dev/checkout/${sessionId}` };
  }

  verifyWebhook(rawBody: Buffer, signature: string | undefined): ProviderEvent {
    return this.stripe.webhooks.constructEvent(rawBody, signature ?? '', this.env.STRIPE_WEBHOOK_SECRET);
  }

  /** Header a genuine Stripe call would carry for this payload. */
  sign(payload: string): string {
    return this.stripe.webhooks.generateTestHeaderString({ payload, secret: this.env.STRIPE_WEBHOOK_SECRET });
  }
}
