import { getQueueToken } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';

import { Tx } from '../../src/common/transaction/transaction.service';
import { Notification } from '../../src/database/entities';
import { MailService } from '../../src/infrastructure/mail/mail.service';
import type { MemoryMailService } from '../../src/infrastructure/mail/memory-mail.service';
import { NOTIFICATIONS_QUEUE } from '../../src/modules/notifications/notifications.constants';
import { sendNotification } from '../../src/modules/notifications/notifications.processor';
import { NotificationsService } from '../../src/modules/notifications/notifications.service';
import { createTestApp, type TestApp } from '../setup/app';

describe('Notification queue (B5-02)', () => {
  let t: TestApp;
  let service: NotificationsService;
  let tx: Tx;
  let queue: Queue;
  beforeAll(async () => {
    t = await createTestApp();
    service = t.app.get(NotificationsService);
    tx = t.app.get(Tx);
    queue = t.app.get(getQueueToken(NOTIFICATIONS_QUEUE));
  });
  afterAll(() => t.app.close());

  it('records the notification and queues one job after commit', async () => {
    const key = `test-${Date.now()}`;
    await tx.run(() => service.schedule('PASSWORD_RESET', 'a@test.local', { firstName: 'Ana', url: 'http://x' }, key));
    const row = await t.dataSource.getRepository(Notification).findOneByOrFail({ uniqueKey: key });
    expect(row.status).toBe('QUEUED');
    expect(await queue.getJob(row.id)).toBeDefined();
  });

  it('ignores a uniqueKey that was already used', async () => {
    const key = `dup-${Date.now()}`;
    const first = await tx.run(() => service.schedule('MEMBERSHIP_RECEIVED', 'b@test.local', { firstName: 'Bo' }, key));
    const second = await tx.run(() => service.schedule('MEMBERSHIP_RECEIVED', 'b@test.local', { firstName: 'Bo' }, key));
    expect([first.scheduled, second.scheduled]).toEqual([true, false]);
    expect(await t.dataSource.getRepository(Notification).countBy({ uniqueKey: key })).toBe(1);
  });

  it('queues nothing when the transaction rolls back', async () => {
    const key = `rollback-${Date.now()}`;
    await expect(
      tx.run(async () => {
        await service.schedule('MEMBERSHIP_RECEIVED', 'c@test.local', { firstName: 'Cy' }, key);
        throw new Error('rollback');
      }),
    ).rejects.toThrow('rollback');
    expect(await t.dataSource.getRepository(Notification).countBy({ uniqueKey: key })).toBe(0);
  });

  it('the worker sends the e-mail once and marks it SENT', async () => {
    const key = `send-${Date.now()}`;
    await tx.run(() => service.schedule('USER_INVITATION', 'd@test.local', { firstName: 'Di', url: 'http://lien' }, key));
    const row = await t.dataSource.getRepository(Notification).findOneByOrFail({ uniqueKey: key });
    const mail = t.app.get(MailService) as MemoryMailService;
    await sendNotification(t.dataSource, mail, row.id);
    await sendNotification(t.dataSource, mail, row.id);
    expect(mail.outbox.filter((m) => m.to === 'd@test.local')).toHaveLength(1);
    expect(mail.lastTo('d@test.local')!.text).toContain('http://lien');
    const sent = await t.dataSource.getRepository(Notification).findOneByOrFail({ id: row.id });
    expect(sent).toMatchObject({ status: 'SENT', attempts: 1 });
  });
});
