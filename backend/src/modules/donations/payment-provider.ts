import type Stripe from 'stripe';

export type CheckoutRequest = {
  paymentId: string;
  amountCents: number;
  donorName: string;
  donorEmail: string;
  successUrl: string;
  cancelUrl: string;
};
export type CheckoutSession = { sessionId: string; url: string };
/** Events use the Stripe shape, whatever the driver. */
export type ProviderEvent = Stripe.Event;

/** The card is typed on the provider's page: the centre never sees or stores card data (ENF-01). */
export abstract class PaymentProvider {
  abstract readonly name: string;
  abstract createCheckout(request: CheckoutRequest): Promise<CheckoutSession>;
  /** Checks the signature of a webhook call on its raw body; throws if it is not genuine. */
  abstract verifyWebhook(rawBody: Buffer, signature: string | undefined): ProviderEvent;
}
