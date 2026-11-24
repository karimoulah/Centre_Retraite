import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';

import { RequestContext } from '../../common/transaction/request-context';
import { Tx } from '../../common/transaction/transaction.service';
import { MAX_ATTEMPTS, NOTIFICATIONS_QUEUE, type NotificationJob, RETRY_BACKOFF } from './notifications.constants';
import type { NotificationData, NotificationType } from './templates';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly tx: Tx,
    @InjectQueue(NOTIFICATIONS_QUEUE) private readonly queue: Queue<NotificationJob>,
  ) {}

  /**
   * Records the notification and queues its sending once the transaction commits.
   * A uniqueKey already used is ignored, so the same message is never sent twice.
   */
  async schedule<K extends NotificationType>(
    type: K,
    recipient: string,
    data: NotificationData[K],
    uniqueKey: string,
  ): Promise<{ scheduled: boolean }> {
    const rows: { id: string }[] = await this.tx.manager.query(
      `INSERT INTO app.notifications (type, recipient, data, unique_key) VALUES ($1, $2, $3, $4)
       ON CONFLICT (unique_key) DO NOTHING RETURNING id`,
      [type, recipient, data, uniqueKey],
    );
    const id = rows[0]?.id;
    if (!id) return { scheduled: false };
    await RequestContext.afterCommit(() =>
      this.queue.add(type, { notificationId: id }, {
        jobId: id,
        attempts: MAX_ATTEMPTS,
        backoff: RETRY_BACKOFF,
        removeOnComplete: 1000,
        removeOnFail: false,
      }),
    );
    return { scheduled: true };
  }
}
