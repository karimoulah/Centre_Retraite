import { DataSource } from 'typeorm';

import { loadDotEnv } from '../config/config';
import { typeormOptions } from './typeorm-options';

// Used by the TypeORM CLI: pnpm migration:run, migration:revert, migration:generate.
loadDotEnv();
export default new DataSource(
  typeormOptions({ DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://centre:centre@localhost:5432/centre_dev' }),
);
