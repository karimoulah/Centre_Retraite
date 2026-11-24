import type { MigrationInterface, QueryRunner } from 'typeorm';

/** B6-02: people and organizations who give money to the centre, optionally linked to a member. */
export class Contributors1765000000002 implements MigrationInterface {
  name = 'Contributors1765000000002';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TYPE app.contributor_kind AS ENUM ('INDIVIDUAL', 'ORGANIZATION');
      CREATE TABLE app.contributors (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        kind app.contributor_kind NOT NULL DEFAULT 'INDIVIDUAL',
        name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 160),
        email text,
        phone text,
        address text,
        notes text,
        member_id uuid UNIQUE REFERENCES app.members (id),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX contributors_email_key ON app.contributors (lower(email)) WHERE email IS NOT NULL;
      CREATE INDEX contributors_name_idx ON app.contributors (lower(name));
      CREATE TRIGGER contributors_touch BEFORE UPDATE ON app.contributors FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();
    `);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE app.contributors; DROP TYPE app.contributor_kind;`);
  }
}
