import { Module } from '@nestjs/common';

import { ENV, type Env } from '../../config/config.module';
import { FinanceModule } from '../finance/finance.module';
import { DonationsController } from './donations.controller';
import { DonationsService } from './donations.service';
import { FakeCheckoutController } from './fake-checkout.controller';
import { FakeProvider } from './fake-provider';
import { PaymentEventsService } from './payment-events';
import { PaymentProvider } from './payment-provider';
import { StripeProvider } from './stripe-provider';
import { WebhooksController, WebhooksService } from './webhooks';

@Module({
  imports: [FinanceModule],
  controllers: [DonationsController, WebhooksController, FakeCheckoutController],
  providers: [
    DonationsService,
    WebhooksService,
    PaymentEventsService,
    {
      provide: PaymentProvider,
      inject: [ENV],
      useFactory: (env: Env) => (env.PAYMENTS_DRIVER === 'stripe' ? new StripeProvider(env) : new FakeProvider(env)),
    },
  ],
  exports: [PaymentProvider, WebhooksService],
})
export class DonationsModule {}
