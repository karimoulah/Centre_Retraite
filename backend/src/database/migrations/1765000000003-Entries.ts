import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * B6-03: accounting entries. The rules that protect the books live in the database,
 * so no code path can break them: a validated entry never changes, only drafts are deleted,
 * the category matches the direction, a correction is the exact opposite of a validated entry.
 */
export class Entries1765000000003 implements MigrationInterface {
  name = 'Entries1765000000003';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TYPE app.entry_status AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'VALIDATED');
      CREATE TYPE app.payment_method AS ENUM ('CASH', 'CHEQUE', 'CARD', 'TRANSFER', 'ONLINE', 'OTHER');
      CREATE TYPE app.entry_source AS ENUM ('MANUAL', 'ONLINE');
      CREATE SEQUENCE app.entry_number_seq;

      CREATE TABLE app.entries (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        reference text NOT NULL UNIQUE
          DEFAULT ('E-' || to_char(now() AT TIME ZONE 'America/Toronto', 'YYYY') || '-' || lpad(nextval('app.entry_number_seq')::text, 5, '0')),
        direction app.entry_direction NOT NULL,
        status app.entry_status NOT NULL DEFAULT 'DRAFT',
        -- Cents, never floats. Positive, except a reversal which is the exact opposite of its entry.
        amount_cents bigint NOT NULL CHECK (amount_cents <> 0),
        entry_date date NOT NULL,
        category_id uuid NOT NULL REFERENCES app.categories (id),
        contributor_id uuid REFERENCES app.contributors (id),
        supplier text,
        payment_method app.payment_method NOT NULL,
        project text,
        description text NOT NULL CHECK (length(trim(description)) BETWEEN 1 AND 500),
        source app.entry_source NOT NULL DEFAULT 'MANUAL',
        attachment_key text,
        attachment_name text,
        attachment_type text,
        attachment_size integer,
        reverses_id uuid UNIQUE REFERENCES app.entries (id),
        reversal_reason text,
        created_by uuid REFERENCES app.users (id),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        decided_by uuid REFERENCES app.users (id),
        decided_at timestamptz,
        rejection_reason text,
        validated_by uuid REFERENCES app.users (id),
        validated_at timestamptz,
        CONSTRAINT entries_sign CHECK ((reverses_id IS NULL) = (amount_cents > 0)),
        CONSTRAINT entries_reversal_complete CHECK (reverses_id IS NULL OR (status = 'VALIDATED' AND length(trim(coalesce(reversal_reason, ''))) >= 5)),
        CONSTRAINT entries_validated_complete CHECK (status <> 'VALIDATED' OR validated_at IS NOT NULL),
        CONSTRAINT entries_rejected_complete CHECK (status <> 'REJECTED' OR length(trim(coalesce(rejection_reason, ''))) >= 5),
        -- Four-eyes rule: whoever approves an expense did not enter it.
        CONSTRAINT entries_approver_not_author CHECK (decided_by IS NULL OR created_by IS NULL OR decided_by <> created_by),
        CONSTRAINT entries_contributor_income CHECK (contributor_id IS NULL OR direction = 'INCOME'),
        CONSTRAINT entries_supplier_expense CHECK (supplier IS NULL OR direction = 'EXPENSE')
      );
      CREATE INDEX entries_date_idx ON app.entries (entry_date DESC, reference DESC);
      CREATE INDEX entries_status_idx ON app.entries (status);
      CREATE INDEX entries_contributor_idx ON app.entries (contributor_id);
      CREATE TRIGGER entries_touch BEFORE UPDATE ON app.entries FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();

      CREATE FUNCTION app.entries_rules() RETURNS trigger LANGUAGE plpgsql AS $$
      DECLARE
        original app.entries;
      BEGIN
        IF TG_OP = 'DELETE' THEN
          IF OLD.status <> 'DRAFT' THEN
            RAISE EXCEPTION 'only a draft entry can be deleted' USING ERRCODE = 'P0409', HINT = 'ENTRY_NOT_DRAFT';
          END IF;
          RETURN OLD;
        END IF;
        IF TG_OP = 'UPDATE' AND OLD.status = 'VALIDATED' THEN
          RAISE EXCEPTION 'a validated entry cannot change' USING ERRCODE = 'P0409', HINT = 'ENTRY_LOCKED';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM app.categories c WHERE c.id = NEW.category_id AND c.direction = NEW.direction) THEN
          RAISE EXCEPTION 'category direction does not match the entry' USING ERRCODE = 'P0422', HINT = 'CATEGORY_DIRECTION_MISMATCH';
        END IF;
        IF NEW.reverses_id IS NOT NULL THEN
          SELECT * INTO original FROM app.entries WHERE id = NEW.reverses_id;
          IF original.status <> 'VALIDATED' OR original.reverses_id IS NOT NULL
             OR NEW.amount_cents <> -original.amount_cents OR NEW.direction <> original.direction
             OR NEW.category_id <> original.category_id THEN
            RAISE EXCEPTION 'a reversal is the exact opposite of a validated entry' USING ERRCODE = 'P0422', HINT = 'REVERSAL_MISMATCH';
          END IF;
        END IF;
        RETURN NEW;
      END $$;
      CREATE TRIGGER entries_rules BEFORE INSERT OR UPDATE OR DELETE ON app.entries FOR EACH ROW EXECUTE FUNCTION app.entries_rules();
    `);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`
      DROP TABLE app.entries;
      DROP FUNCTION app.entries_rules();
      DROP SEQUENCE app.entry_number_seq;
      DROP TYPE app.entry_source;
      DROP TYPE app.payment_method;
      DROP TYPE app.entry_status;
    `);
  }
}
