import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { LoggingModule } from './infrastructure/logging/logging.module';
import { MailModule } from './infrastructure/mail/mail.module';
import { ChatbotProcessor } from './modules/chatbot/chatbot.processor';
import { CHATBOT_QUEUE } from './modules/chatbot/chatbot.constants';
import { embeddingsProvider } from './modules/chatbot/chatbot.module';
import { IndexingService } from './modules/chatbot/indexing.service';
import { NOTIFICATIONS_QUEUE } from './modules/notifications/notifications.constants';
import { bullRoot } from './modules/notifications/notifications.module';
import { NotificationsProcessor } from './modules/notifications/notifications.processor';

/** Background worker: sends the e-mails and indexes the site pages for the assistant (pnpm start:worker:dev). */
@Module({
  imports: [
    ConfigModule,
    LoggingModule,
    DatabaseModule,
    MailModule,
    bullRoot,
    BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE }, { name: CHATBOT_QUEUE }),
  ],
  providers: [NotificationsProcessor, ChatbotProcessor, IndexingService, embeddingsProvider],
})
export class WorkerModule {}
