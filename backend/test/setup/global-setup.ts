import Redis from 'ioredis';
import { Client } from 'pg';

import './env';

/** Starts every e2e run from an empty database (the API re-applies its migrations) and fresh rate-limit counters. */
export default async function globalSetup() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query('DROP SCHEMA IF EXISTS app CASCADE; DROP TABLE IF EXISTS public.api_migrations;');
  await client.end();
  await clearRateLimits();
}

export async function clearRateLimits() {
  const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');
  const keys = await redis.keys('lesaines-test:rate:*');
  if (keys.length) await redis.del(...keys);
  await redis.quit();
}
