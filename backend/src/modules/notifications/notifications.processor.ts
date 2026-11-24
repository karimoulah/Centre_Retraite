import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { DataSource } from 'typeorm';

import { Notification } from '../../database/entities';
import { MailService } from '../../infrastructure/mail/mail.service';
import { MAX_ATTEMPTS, NOTIFICATIONS_QUEUE, type NotificationJob } from './notifications.constants';
import { render, type NotificationType } from './templates';

/** Worker: sends each queued notification; BullMQ retries 5 times with exponential backoff. */
@Processor(NOTIFICATIONS_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly mail: MailService,
  ) {
    super();
  }

  async process(job: Job<NotificationJob>): Promise<void> {
    await sendNotification(this.dataSource, this.mail, job.data.notificationId);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<NotificationJob>, error: Error) {
    const final = job.attemptsMade >= (job.opts.attempts ?? MAX_ATTEMPTS);
    await this.dataSource
      .getRepository(Notification)
      .update(job.data.notificationId, { status: final ? 'FAILED' : 'QUEUED', lastError: error.message.slice(0, 500) });
    this.logger.warn(`Notification ${job.data.notificationId} failed (attempt ${job.attemptsMade}): ${error.message}`);
  }
}

/** Sends one notification at most once: a notification already SENT is skipped. */
export async function sendNotification(dataSource: DataSource, mail: MailService, id: string): Promise<void> {
  const repo = dataSource.getRepository(Notification);
  const notification = await repo.findOneBy({ id });
  if (!notification || notification.status === 'SENT') return;
  await repo.increment({ id }, 'attempts', 1);
  const message = render(notification.type as NotificationType, notification.data as never);
  await mail.send({ to: notification.recipient, ...message });
  await repo.update(id, { status: 'SENT', sentAt: new Date(), lastError: null });
}
