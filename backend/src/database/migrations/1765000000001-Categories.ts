import type { MigrationInterface, QueryRunner } from 'typeorm';

/** B6-01: income and expense categories. A category is deactivated, never deleted. */
export class Categories1765000000001 implements MigrationInterface {
  name = 'Categories1765000000001';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TYPE app.entry_direction AS ENUM ('INCOME', 'EXPENSE');

      CREATE TABLE app.categories (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 80),
        direction app.entry_direction NOT NULL,
        -- Only income can give a tax receipt (donations).
        receipt_eligible boolean NOT NULL DEFAULT false,
        active boolean NOT NULL DEFAULT true,
        -- Categories the system relies on (DONATION for online gifts).
        code text UNIQUE,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT categories_receipt_income_only CHECK (NOT receipt_eligible OR direction = 'INCOME')
      );
      CREATE UNIQUE INDEX categories_name_key ON app.categories (direction, lower(name));
      CREATE TRIGGER categories_touch BEFORE UPDATE ON app.categories FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();

      -- The direction of a category never changes: entries already filed under it would change meaning.
      CREATE FUNCTION app.categories_direction_fixed() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF NEW.direction <> OLD.direction THEN
          RAISE EXCEPTION 'category direction cannot change' USING ERRCODE = 'P0422', HINT = 'CATEGORY_DIRECTION_FIXED';
        END IF;
        RETURN NEW;
      END $$;
      CREATE TRIGGER categories_direction_fixed BEFORE UPDATE ON app.categories FOR EACH ROW EXECUTE FUNCTION app.categories_direction_fixed();

      INSERT INTO app.categories (name, direction, receipt_eligible, code) VALUES
        ('Dons', 'INCOME', true, 'DONATION'),
        ('Cotisations des membres', 'INCOME', false, NULL),
        ('Subventions', 'INCOME', false, NULL),
        ('Activités et sorties', 'INCOME', false, NULL),
        ('Loyer et charges', 'EXPENSE', false, NULL),
        ('Fournitures de bureau', 'EXPENSE', false, NULL),
        ('Activités et sorties', 'EXPENSE', false, NULL),
        ('Communication et impression', 'EXPENSE', false, NULL),
        ('Frais bancaires', 'EXPENSE', false, NULL);
    `);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`
      DROP TABLE app.categories;
      DROP FUNCTION app.categories_direction_fixed();
      DROP TYPE app.entry_direction;
    `);
  }
}
