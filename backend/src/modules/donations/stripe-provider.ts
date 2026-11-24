import Stripe from 'stripe';

import type { Env } from '../../config/config.module';
import { type CheckoutRequest, type CheckoutSession, PaymentProvider, type ProviderEvent } from './payment-provider';

/** Stripe Checkout, test mode in development (sk_test_…). Payment methods come from the Stripe dashboard. */
export class StripeProvider extends PaymentProvider {
  readonly name = 'STRIPE';
  private readonly stripe: Stripe;

  constructor(private readonly env: Env) {
    super();
    this.stripe = new Stripe(env.STRIPE_SECRET_KEY!);
  }

  async createCheckout(r: CheckoutRequest): Promise<CheckoutSession> {
    const session = await this.stripe.checkout.sessions.create(
      {
        mode: 'payment',
        locale: 'fr-CA',
        customer_email: r.donorEmail,
        client_reference_id: r.paymentId,
        metadata: { paymentId: r.paymentId, donorName: r.donorName },
        payment_intent_data: { metadata: { paymentId: r.paymentId } },
        line_items: [
          {
            quantity: 1,
            price_data: { currency: 'cad', unit_amount: r.amountCents, product_data: { name: 'Don au Centre d’accompagnement des retraités' } },
          },
        ],
        success_url: r.successUrl,
        cancel_url: r.cancelUrl,
      },
      { idempotencyKey: `checkout-${r.paymentId}` },
    );
    return { sessionId: session.id, url: session.url! };
  }

  verifyWebhook(rawBody: Buffer, signature: string | undefined): ProviderEvent {
    return this.stripe.webhooks.constructEvent(rawBody, signature ?? '', this.env.STRIPE_WEBHOOK_SECRET);
  }
}
