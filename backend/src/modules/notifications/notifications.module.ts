import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';

import { ENV, type Env } from '../../config/config.module';
import { NOTIFICATIONS_QUEUE } from './notifications.constants';
import { NotificationsService } from './notifications.service';

export const bullRoot = BullModule.forRootAsync({
  inject: [ENV],
  useFactory: (env: Env) => ({ connection: { url: env.REDIS_URL }, prefix: `lesaines-${env.NODE_ENV}` }),
});

/** Scheduling side (API). The sending side runs in the worker process (src/worker.ts). */
@Global()
@Module({
  imports: [bullRoot, BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE })],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
