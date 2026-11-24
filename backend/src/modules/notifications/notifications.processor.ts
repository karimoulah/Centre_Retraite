import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { DataSource, Not } from 'typeorm';

import { Notification } from '../../database/entities';
import { MailService } from '../../infrastructure/mail/mail.service';
import { MAX_ATTEMPTS, NOTIFICATIONS_QUEUE, type NotificationJob } from './notifications.constants';
import { render, type NotificationType } from './templates';

/** Worker (separate process, src/worker.ts): sends each queued notification, 3 attempts with growing delay. */
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
    const status = await recordFailure(this.dataSource, job.data.notificationId, job.attemptsMade, job.opts.attempts ?? MAX_ATTEMPTS, error);
    this.logger.warn(`Notification ${job.data.notificationId} ${status} (attempt ${job.attemptsMade}): ${error.message}`);
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

/** After a failed attempt: FAILED while another attempt is planned, ABANDONED after the last one. The error is kept. */
export async function recordFailure(
  dataSource: DataSource,
  id: string,
  attemptsMade: number,
  maxAttempts: number,
  error: Error,
): Promise<'FAILED' | 'ABANDONED'> {
  const status = attemptsMade >= maxAttempts ? 'ABANDONED' : 'FAILED';
  await dataSource
    .getRepository(Notification)
    .update({ id, status: Not('SENT') }, { status, lastError: error.message.slice(0, 500), failedAt: new Date() });
  return status;
}
