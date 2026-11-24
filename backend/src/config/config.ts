import { existsSync } from 'node:fs';

import { envSchema, type Env } from './env.schema';

/** Validates process.env once; throws a readable list of problems instead of starting half-configured. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues.map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`);
    throw new Error(`Invalid environment configuration:\n${problems.join('\n')}`);
  }
  return result.data;
}

/** Loads .env from the working directory when present (Node's built-in loader, no extra dependency). */
export function loadDotEnv(path = '.env'): void {
  if (existsSync(path)) process.loadEnvFile(path);
}
