import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Sex asked in the membership form (two options), copied to the member on approval. Empty for records made before. */
export class Sex1765000000006 implements MigrationInterface {
  name = 'Sex1765000000006';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TYPE app.sex AS ENUM ('MALE', 'FEMALE');
      ALTER TABLE app.membership_requests ADD COLUMN sex app.sex;
      ALTER TABLE app.members ADD COLUMN sex app.sex;
    `);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`
      ALTER TABLE app.members DROP COLUMN sex;
      ALTER TABLE app.membership_requests DROP COLUMN sex;
      DROP TYPE app.sex;
    `);
  }
}
