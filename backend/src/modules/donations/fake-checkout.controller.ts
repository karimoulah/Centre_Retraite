import { Controller, Get, HttpCode, Inject, Param, Post, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';

import { AppError } from '../../common/app-error';
import { Public } from '../../common/public.decorator';
import { Tx } from '../../common/transaction/transaction.service';
import { ENV, type Env } from '../../config/config.module';
import { Payment } from '../../database/entities';
import { FakeProvider } from './fake-provider';
import { PaymentProvider } from './payment-provider';
import { WebhooksService } from './webhooks';

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const money = (cents: number) => (cents / 100).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });

/**
 * Development only (PAYMENTS_DRIVER=fake): stands in for the Stripe page. "Payer" sends the same
 * signed event Stripe would, through the real webhook pipeline, then returns to the site.
 */
@ApiExcludeController()
@Public()
@Controller('dev/checkout')
export class FakeCheckoutController {
  constructor(
    private readonly provider: PaymentProvider,
    private readonly webhooks: WebhooksService,
    private readonly tx: Tx,
    @Inject(ENV) private readonly env: Env,
  ) {}

  @Get(':sessionId')
  async page(@Param('sessionId') sessionId: string, @Res() res: Response) {
    const s = await this.session(sessionId);
    // helmet's no-referrer makes browsers send "Origin: null" on the form POST, which the CSRF check refuses.
    res.setHeader('Referrer-Policy', 'same-origin');
    // The form then redirects to the site: form-action must allow it (Chrome applies it to redirects).
    res.setHeader('Content-Security-Policy', `default-src 'none'; style-src 'unsafe-inline'; form-action 'self' ${new URL(this.env.WEB_URL).origin}`);
    res.type('html').send(`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Paiement de test</title>
<body style="font:18px system-ui;max-width:28rem;margin:4rem auto;padding:0 1rem">
<p style="background:#fff3cd;padding:.75rem;border-radius:.5rem">Page de paiement de <strong>test</strong> (aucun vrai paiement).</p>
<h1>Don de ${money(s.amountCents)}</h1><p>${escape(s.donorName)} — ${escape(s.donorEmail)}</p>
<form method="post" action="${sessionId}/pay"><button style="font-size:1.1rem;padding:.75rem 1.5rem">Payer ${money(s.amountCents)}</button></form>
<form method="post" action="${sessionId}/cancel" style="margin-top:1rem"><button style="padding:.5rem 1rem">Annuler</button></form>
</body></html>`);
  }

  @HttpCode(303)
  @Post(':sessionId/pay')
  async pay(@Param('sessionId') sessionId: string, @Res() res: Response) {
    const s = await this.session(sessionId);
    await this.webhooks.receive({
      id: `evt_fake_${sessionId}`,
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: sessionId,
          object: 'checkout.session',
          payment_status: 'paid',
          amount_total: s.amountCents,
          client_reference_id: s.id,
          metadata: { paymentId: s.id },
          payment_intent: `pi_fake_${sessionId.slice(8)}`,
        },
      },
    } as never);
    res.redirect(303, `${this.web()}/donate/thank-you?session_id=${sessionId}`);
  }

  @HttpCode(303)
  @Post(':sessionId/cancel')
  async cancel(@Param('sessionId') sessionId: string, @Res() res: Response) {
    await this.session(sessionId);
    res.redirect(303, `${this.web()}/donate/cancelled`);
  }

  private web() {
    return this.env.WEB_URL.replace(/\/$/, '');
  }

  /** Read from the database, so the page survives a restart of the API. */
  private async session(sessionId: string): Promise<Payment> {
    const payment = this.provider instanceof FakeProvider ? await this.tx.repo(Payment).findOneBy({ checkoutSessionId: sessionId }) : null;
    if (!payment || payment.status !== 'PENDING') throw new AppError(404, 'NOT_FOUND', 'Session de paiement introuvable ou déjà réglée.');
    return payment;
  }
}
