import { Client } from 'pg';

import './env';

/** Starts every e2e run from an empty database: the API re-applies its migrations at start-up. */
export default async function globalSetup() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query('DROP SCHEMA IF EXISTS app CASCADE; DROP TABLE IF EXISTS public.api_migrations;');
  await client.end();
}
