import { Inject, Injectable, Logger } from '@nestjs/common';

import { AppError } from '../../common/app-error';
import { Tx } from '../../common/transaction/transaction.service';
import { ENV, type Env } from '../../config/config.module';
import { Payment } from '../../database/entities';
import { TurnstileService } from '../../infrastructure/turnstile/turnstile.service';
import { AuditService } from '../audit/audit.service';
import type { CheckoutDto } from './donations.schemas';
import { PaymentProvider } from './payment-provider';

@Injectable()
export class DonationsService {
  private readonly logger = new Logger(DonationsService.name);

  constructor(
    private readonly tx: Tx,
    private readonly provider: PaymentProvider,
    private readonly turnstile: TurnstileService,
    private readonly audit: AuditService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /** PENDING payment, then the provider's checkout page. The gift counts only once the provider confirms it. */
  async checkout(dto: CheckoutDto, ip?: string) {
    await this.turnstile.verify(dto.turnstileToken, ip);
    const repo = this.tx.repo(Payment);
    const payment = await repo.save(
      repo.create({ provider: this.provider.name, amountCents: dto.amountCents, donorName: dto.donorName, donorEmail: dto.donorEmail }),
    );
    const web = this.env.WEB_URL.replace(/\/$/, '');
    let session;
    try {
      session = await this.provider.createCheckout({
        paymentId: payment.id,
        amountCents: dto.amountCents,
        donorName: dto.donorName,
        donorEmail: dto.donorEmail,
        successUrl: `${web}/donate/thank-you?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${web}/donate/cancelled`,
      });
    } catch (error) {
      this.logger.error(`Checkout creation failed: ${String(error)}`);
      throw new AppError(502, 'PAYMENT_PROVIDER_ERROR', 'Le paiement en ligne est momentanément indisponible. Réessayez dans quelques minutes.');
    }
    await repo.update(payment.id, { checkoutSessionId: session.sessionId });
    await this.audit.record({
      action: 'DONATION_STARTED',
      entityType: 'Payment',
      entityId: payment.id,
      entityLabel: dto.donorName,
      after: { amountCents: dto.amountCents, provider: this.provider.name },
    });
    return { url: session.url };
  }

  /** Thank-you page: status and amount only, no personal data. */
  async status(sessionId: string) {
    const payment = await this.tx.repo(Payment).findOneBy({ checkoutSessionId: sessionId });
    if (!payment) throw new AppError(404, 'NOT_FOUND', 'Don introuvable.');
    return { status: payment.status, amountCents: payment.amountCents };
  }
}
