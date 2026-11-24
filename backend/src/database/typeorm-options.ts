import type { DataSourceOptions } from 'typeorm';

import type { Env } from '../config/env.schema';
import { entities } from './entities';
import { InitialSchema1764000000000 } from './migrations/1764000000000-InitialSchema';
import { NotificationAbandoned1765000000000 } from './migrations/1765000000000-NotificationAbandoned';
import { Categories1765000000001 } from './migrations/1765000000001-Categories';
import { Contributors1765000000002 } from './migrations/1765000000002-Contributors';

export const migrations = [InitialSchema1764000000000, NotificationAbandoned1765000000000, Categories1765000000001, Contributors1765000000002];

/** Single source of truth for the API, the CLI and the tests. synchronize is never used. */
export function typeormOptions(env: Pick<Env, 'DATABASE_URL'>): DataSourceOptions {
  return {
    type: 'postgres',
    url: env.DATABASE_URL,
    entities,
    migrations,
    // Kept in "public": the "app" schema is created by the first migration itself.
    migrationsTableName: 'api_migrations',
    synchronize: false,
  };
}
