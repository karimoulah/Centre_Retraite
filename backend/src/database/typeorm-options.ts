import type { DataSourceOptions } from 'typeorm';

import type { Env } from '../config/env.schema';
import { entities } from './entities';
import { InitialSchema1764000000000 } from './migrations/1764000000000-InitialSchema';
import { NotificationAbandoned1765000000000 } from './migrations/1765000000000-NotificationAbandoned';
import { Categories1765000000001 } from './migrations/1765000000001-Categories';
import { Contributors1765000000002 } from './migrations/1765000000002-Contributors';
import { Entries1765000000003 } from './migrations/1765000000003-Entries';
import { Payments1765000000004 } from './migrations/1765000000004-Payments';
import { ChatbotIndex1765000000005 } from './migrations/1765000000005-ChatbotIndex';
import { Sex1765000000006 } from './migrations/1765000000006-Sex';

export const migrations = [InitialSchema1764000000000, NotificationAbandoned1765000000000, Categories1765000000001, Contributors1765000000002, Entries1765000000003, Payments1765000000004, ChatbotIndex1765000000005, Sex1765000000006];

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
