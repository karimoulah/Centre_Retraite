import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { LoggingModule } from './infrastructure/logging/logging.module';
import { MailModule } from './infrastructure/mail/mail.module';
import { NOTIFICATIONS_QUEUE } from './modules/notifications/notifications.constants';
import { bullRoot } from './modules/notifications/notifications.module';
import { NotificationsProcessor } from './modules/notifications/notifications.processor';

/** Background worker: consumes the notifications queue (pnpm start:worker:dev). */
@Module({
  imports: [ConfigModule, LoggingModule, DatabaseModule, MailModule, bullRoot, BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE })],
  providers: [NotificationsProcessor],
})
export class WorkerModule {}
