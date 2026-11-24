import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';

import { CHATBOT_QUEUE, type SyncJob } from './chatbot.constants';
import { type IndexResult, IndexingService } from './indexing.service';

/** Worker side: one page at a time, in arrival order, so the last version of a page wins. */
@Processor(CHATBOT_QUEUE, { concurrency: 1 })
export class ChatbotProcessor extends WorkerHost {
  constructor(private readonly indexing: IndexingService) {
    super();
  }

  process(job: Job<SyncJob>): Promise<IndexResult> {
    return job.data.event === 'upsert'
      ? this.indexing.index(job.data.page)
      : this.indexing.remove(job.data.page.id);
  }
}
