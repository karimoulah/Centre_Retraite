import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import type Stripe from 'stripe';

import { Tx } from '../../common/transaction/transaction.service';
import { Category, Entry, Payment } from '../../database/entities';
import { AuditService } from '../audit/audit.service';
import { ContributorsService } from '../finance/contributors';
import { snapshot } from '../finance/entries/entries.service';
import { ValidationService } from '../finance/entries/validation';
import { NotificationsService } from '../notifications/notifications.service';
import type { ProviderEvent } from './payment-provider';
import { WebhooksService } from './webhooks';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
const longDate = () => new Date().toLocaleDateString('fr-CA', { timeZone: 'America/Toronto', day: 'numeric', month: 'long', year: 'numeric' });
const intentId = (value: string | { id: string } | null | undefined) => (typeof value === 'string' ? value : (value?.id ?? null));

/**
 * B7-03: a confirmed payment becomes, in one database transaction, a CONFIRMED payment,
 * a contributor (found or created), a VALIDATED donation entry and a confirmation e-mail.
 * A refund reverses that entry. Every step is idempotent: the same payment is never counted twice.
 */
@Injectable()
export class PaymentEventsService implements OnModuleInit {
  private readonly logger = new Logger(PaymentEventsService.name);

  constructor(
    private readonly tx: Tx,
    private readonly webhooks: WebhooksService,
    private readonly contributors: ContributorsService,
    private readonly validation: ValidationService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  onModuleInit() {
    const session = (event: ProviderEvent) => event.data.object as Stripe.Checkout.Session;
    this.webhooks.on('checkout.session.completed', (e) => (session(e).payment_status === 'paid' ? this.confirm(session(e)) : this.pendingAsync(session(e))));
    this.webhooks.on('checkout.session.async_payment_succeeded', (e) => this.confirm(session(e)));
    this.webhooks.on('checkout.session.async_payment_failed', (e) => this.close(session(e), 'FAILED'));
    this.webhooks.on('checkout.session.expired', (e) => this.close(session(e), 'EXPIRED'));
    this.webhooks.on('charge.refunded', (e) => this.refund(e.data.object as Stripe.Charge));
  }

  async confirm(session: Stripe.Checkout.Session): Promise<string | null> {
    const payment = await this.lockForSession(session);
    if (!payment) return null;
    if (payment.status === 'CONFIRMED' || payment.status === 'REFUNDED') return payment.id;
    if (session.amount_total !== null && session.amount_total !== payment.amountCents) {
      this.logger.warn(`Payment ${payment.id}: provider amount ${session.amount_total} differs from ${payment.amountCents}; provider amount kept`);
      payment.amountCents = session.amount_total;
    }

    const contributor = await this.contributors.findOrCreateByEmail(payment.donorEmail, payment.donorName);
    const category = await this.tx.repo(Category).findOneByOrFail({ code: 'DONATION' });
    const entries = this.tx.repo(Entry);
    const saved = await entries.save(
      entries.create({
        direction: 'INCOME',
        status: 'VALIDATED',
        amountCents: payment.amountCents,
        entryDate: today(),
        categoryId: category.id,
        contributorId: contributor.id,
        paymentMethod: 'ONLINE',
        description: `Don en ligne — ${payment.donorName}`.slice(0, 500),
        source: 'ONLINE',
        validatedAt: new Date(),
      }),
    );
    const entry = await entries.findOneByOrFail({ id: saved.id });
    await this.tx.repo(Payment).update(payment.id, {
      status: 'CONFIRMED',
      amountCents: payment.amountCents,
      confirmedAt: new Date(),
      paymentIntentId: intentId(session.payment_intent),
      contributorId: contributor.id,
      entryId: entry.id,
    });
    await this.audit.record({ action: 'ENTRY_CREATED', entityType: 'Entry', entityId: entry.id, entityLabel: entry.reference, after: { ...snapshot(entry), source: 'ONLINE', paymentId: payment.id } });
    await this.audit.record({
      action: 'PAYMENT_CONFIRMED',
      entityType: 'Payment',
      entityId: payment.id,
      entityLabel: payment.donorName,
      before: { status: payment.status },
      after: { status: 'CONFIRMED', amountCents: payment.amountCents, entry: entry.reference },
    });
    await this.notifications.schedule(
      'DONATION_CONFIRMED',
      payment.donorEmail,
      { name: payment.donorName, amountCents: payment.amountCents, reference: entry.reference, date: longDate() },
      `donation-confirmed:${payment.id}`,
    );
    return payment.id;
  }

  /** Bank transfer and similar methods: paid later (async_payment_succeeded). */
  private async pendingAsync(session: Stripe.Checkout.Session) {
    const payment = await this.lockForSession(session);
    if (payment) await this.tx.repo(Payment).update(payment.id, { paymentIntentId: intentId(session.payment_intent) });
    return payment?.id ?? null;
  }

  private async close(session: Stripe.Checkout.Session, status: 'FAILED' | 'EXPIRED') {
    const payment = await this.lockForSession(session);
    if (!payment || payment.status !== 'PENDING') return payment?.id ?? null;
    await this.tx.repo(Payment).update(payment.id, { status, failedAt: new Date() });
    await this.audit.record({ action: `PAYMENT_${status}`, entityType: 'Payment', entityId: payment.id, entityLabel: payment.donorName, before: { status: 'PENDING' }, after: { status } });
    return payment.id;
  }

  /** Full refund → the donation entry is reversed (once). A partial refund is recorded for the treasurer only. */
  private async refund(charge: Stripe.Charge) {
    const intent = intentId(charge.payment_intent);
    if (!intent) return null;
    const payment = await this.tx.repo(Payment).createQueryBuilder('p').setLock('pessimistic_write').where('p.payment_intent_id = :intent', { intent }).getOne();
    if (!payment || payment.status !== 'CONFIRMED' || !payment.entryId) return payment?.id ?? null;
    if (charge.amount_refunded < charge.amount) {
      await this.audit.record({
        action: 'PAYMENT_PARTIALLY_REFUNDED',
        entityType: 'Payment',
        entityId: payment.id,
        entityLabel: payment.donorName,
        after: { refundedCents: charge.amount_refunded },
      });
      return payment.id;
    }
    const reversal = await this.validation.reverse(payment.entryId, 'Remboursement du don en ligne', null);
    await this.tx.repo(Payment).update(payment.id, { status: 'REFUNDED', refundedAt: new Date(), refundEntryId: reversal.id });
    await this.audit.record({ action: 'PAYMENT_REFUNDED', entityType: 'Payment', entityId: payment.id, entityLabel: payment.donorName, before: { status: 'CONFIRMED' }, after: { status: 'REFUNDED', reversal: reversal.reference } });
    return payment.id;
  }

  private async lockForSession(session: Stripe.Checkout.Session): Promise<Payment | null> {
    const qb = this.tx.repo(Payment).createQueryBuilder('p').setLock('pessimistic_write');
    const id = session.metadata?.paymentId ?? session.client_reference_id;
    // A malformed id must not reach PostgreSQL: the error would abort the whole transaction.
    const payment = id && UUID.test(id)
      ? await qb.where('p.id = :id', { id }).getOne()
      : await qb.where('p.checkout_session_id = :sid', { sid: session.id }).getOne();
    if (!payment) this.logger.warn(`No payment for checkout session ${session.id}`);
    return payment;
  }
}
