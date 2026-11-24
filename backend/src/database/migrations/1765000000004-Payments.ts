import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * B7-01/B7-02: online donations. No card data is ever stored: the provider holds it.
 * webhook_events makes every provider event count once (its id is the idempotency key).
 */
export class Payments1765000000004 implements MigrationInterface {
  name = 'Payments1765000000004';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TYPE app.payment_status AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'EXPIRED', 'REFUNDED');
      CREATE TABLE app.payments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        provider text NOT NULL,
        status app.payment_status NOT NULL DEFAULT 'PENDING',
        amount_cents bigint NOT NULL CHECK (amount_cents >= 500),
        currency text NOT NULL DEFAULT 'CAD',
        donor_name text NOT NULL,
        donor_email text NOT NULL,
        checkout_session_id text UNIQUE,
        payment_intent_id text UNIQUE,
        contributor_id uuid REFERENCES app.contributors (id),
        entry_id uuid UNIQUE REFERENCES app.entries (id),
        refund_entry_id uuid UNIQUE REFERENCES app.entries (id),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        confirmed_at timestamptz,
        failed_at timestamptz,
        refunded_at timestamptz,
        CONSTRAINT payments_confirmed_has_entry CHECK (status NOT IN ('CONFIRMED', 'REFUNDED') OR entry_id IS NOT NULL)
      );
      CREATE INDEX payments_status_idx ON app.payments (status, created_at DESC);
      CREATE TRIGGER payments_touch BEFORE UPDATE ON app.payments FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();

      CREATE TABLE app.webhook_events (
        id text PRIMARY KEY,
        provider text NOT NULL,
        type text NOT NULL,
        received_at timestamptz NOT NULL DEFAULT now(),
        payment_id uuid REFERENCES app.payments (id)
      );
    `);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE app.webhook_events; DROP TABLE app.payments; DROP TYPE app.payment_status;`);
  }
}
