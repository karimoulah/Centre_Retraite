export interface Env {
  DATABASE_URL: string;
  PORT: number;
  FRONTEND_ORIGIN: string;
}

export function validateEnv(config: Record<string, unknown>): Env {
  const url = config.DATABASE_URL;
  if (typeof url !== 'string' || url.length === 0) {
    throw new Error('DATABASE_URL est obligatoire (voir .env.example)');
  }
  return {
    DATABASE_URL: url,
    PORT: Number(config.PORT ?? 3000),
    FRONTEND_ORIGIN: String(config.FRONTEND_ORIGIN ?? 'http://localhost:5173'),
  };
}
