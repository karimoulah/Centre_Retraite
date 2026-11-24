import { Module } from '@nestjs/common';

import { ENV, type Env } from '../../config/config.module';
import { DonationsController } from './donations.controller';
import { DonationsService } from './donations.service';
import { FakeProvider } from './fake-provider';
import { PaymentProvider } from './payment-provider';
import { StripeProvider } from './stripe-provider';
import { WebhooksController, WebhooksService } from './webhooks';

@Module({
  controllers: [DonationsController, WebhooksController],
  providers: [
    DonationsService,
    WebhooksService,
    {
      provide: PaymentProvider,
      inject: [ENV],
      useFactory: (env: Env) => (env.PAYMENTS_DRIVER === 'stripe' ? new StripeProvider(env) : new FakeProvider(env)),
    },
  ],
  exports: [PaymentProvider, WebhooksService],
})
export class DonationsModule {}
