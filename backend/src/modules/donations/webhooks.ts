import { Controller, Headers, HttpCode, Injectable, Logger, Post, type RawBodyRequest, Req } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';

import { AppError } from '../../common/app-error';
import { Public } from '../../common/public.decorator';
import { Tx } from '../../common/transaction/transaction.service';
import { PaymentProvider, type ProviderEvent } from './payment-provider';

/** Handlers per event type, registered by the services that act on payments (B7-03). */
export type EventHandler = (event: ProviderEvent) => Promise<string | null | void>;

/**
 * Idempotent intake (B7-02): the provider's event id is the idempotency key. The event row and its
 * effects are written in the same transaction, so a replayed event is a no-op and a failed one is retried.
 */
@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private readonly handlers = new Map<string, EventHandler>();

  constructor(
    private readonly tx: Tx,
    private readonly provider: PaymentProvider,
  ) {}

  on(type: string, handler: EventHandler) {
    this.handlers.set(type, handler);
  }

  async receive(event: ProviderEvent): Promise<{ received: true; duplicate?: true }> {
    const inserted: { id: string }[] = await this.tx.manager.query(
      `INSERT INTO app.webhook_events (id, provider, type) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING RETURNING id`,
      [event.id, this.provider.name, event.type],
    );
    if (!inserted.length) {
      this.logger.log(`Event ${event.id} (${event.type}) already processed: ignored`);
      return { received: true, duplicate: true };
    }
    const paymentId = await this.handlers.get(event.type)?.(event);
    if (paymentId) await this.tx.manager.query(`UPDATE app.webhook_events SET payment_id = $2 WHERE id = $1`, [event.id, paymentId]);
    return { received: true };
  }
}

@ApiTags('donations')
@Public()
@SkipThrottle()
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly provider: PaymentProvider,
    private readonly webhooks: WebhooksService,
  ) {}

  /** Stripe → API. 400 if the signature is wrong (Stripe then retries), 200 as soon as the event is recorded. */
  @ApiExcludeEndpoint()
  @HttpCode(200)
  @Post('stripe')
  receive(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') signature?: string) {
    let event: ProviderEvent;
    try {
      event = this.provider.verifyWebhook(req.rawBody ?? Buffer.alloc(0), signature);
    } catch {
      throw new AppError(400, 'INVALID_SIGNATURE', 'Signature du webhook invalide.');
    }
    return this.webhooks.receive(event);
  }
}
