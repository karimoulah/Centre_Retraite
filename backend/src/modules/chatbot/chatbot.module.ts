import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { ENV, type Env } from '../../config/config.module';
import { bullRoot } from '../notifications/notifications.module';
import { CHATBOT_QUEUE } from './chatbot.constants';
import { EmbeddingsProvider, FakeEmbeddings, VoyageEmbeddings } from './embeddings';
import { IndexingService } from './indexing.service';
import { ChatbotSyncController } from './sync.controller';

export const embeddingsProvider = {
  provide: EmbeddingsProvider,
  inject: [ENV],
  useFactory: (env: Env) =>
    env.EMBEDDINGS_DRIVER === 'voyage' ? new VoyageEmbeddings(env) : new FakeEmbeddings(),
};

/** API side: receives Payload's notifications and queues them. Indexing runs in the worker. */
@Module({
  imports: [bullRoot, BullModule.registerQueue({ name: CHATBOT_QUEUE })],
  controllers: [ChatbotSyncController],
  providers: [embeddingsProvider, IndexingService],
  exports: [IndexingService],
})
export class ChatbotModule {}
