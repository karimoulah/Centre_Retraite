import type { MigrationInterface, QueryRunner } from 'typeorm';

/** B5-03: FAILED now means "failed, will retry"; ABANDONED means every attempt failed. */
export class NotificationAbandoned1765000000000 implements MigrationInterface {
  name = 'NotificationAbandoned1765000000000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TYPE app.notification_status ADD VALUE IF NOT EXISTS 'ABANDONED'`);
    await q.query(`ALTER TABLE app.notifications ADD COLUMN failed_at timestamptz`);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE app.notifications DROP COLUMN failed_at`);
    await q.query(`UPDATE app.notifications SET status = 'FAILED' WHERE status = 'ABANDONED'`);
    // PostgreSQL cannot drop an enum value; ABANDONED stays unused.
  }
}
