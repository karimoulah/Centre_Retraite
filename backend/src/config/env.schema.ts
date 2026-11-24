import { z } from 'zod';

const bool = (fallback: boolean) =>
  z
    .enum(['true', 'false', '1', '0'])
    .optional()
    .transform((value) => (value === undefined ? fallback : value === 'true' || value === '1'));

/** Every environment variable the API reads. The API refuses to start if one is missing or invalid. */
export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    WEB_URL: z.url().default('http://localhost:5173'),

    DATABASE_URL: z.url(),
    REDIS_URL: z.url().default('redis://localhost:6379'),

    JWT_ACCESS_SECRET: z.string().min(32, 'must be at least 32 characters'),
    JWT_REFRESH_SECRET: z.string().min(32, 'must be at least 32 characters'),
    ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
    REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(7 * 24 * 3600),
    AUTH_ACCESS_COOKIE: z.string().default('access_token'),
    AUTH_REFRESH_COOKIE: z.string().default('refresh_token'),
    COOKIE_SECURE: z.enum(['true', 'false', '1', '0']).optional(),

    MAIL_TRANSPORT: z.enum(['smtp', 'brevo', 'memory']).default('smtp'),
    MAIL_FROM: z.string().default('Les Aînés <ne-pas-repondre@lesaines.test>'),
    CENTER_EMAIL: z.email().default('info@lesaines.test'),
    SMTP_HOST: z.string().default('localhost'),
    SMTP_PORT: z.coerce.number().int().positive().default(1025),
    BREVO_API_KEY: z.string().optional(),
    BREVO_SANDBOX: bool(true),

    TURNSTILE_SECRET_KEY: z.string().optional(),

    /** Receipts and media: "local" (files on disk, development and tests) or "r2" (Cloudflare R2, private bucket). */
    STORAGE_DRIVER: z.enum(['local', 'r2']).default('local'),
    STORAGE_LOCAL_DIR: z.string().default('.storage'),
    /** Base of the signed URLs of the local driver (the API itself). */
    STORAGE_PUBLIC_URL: z.url().default('http://localhost:3000/api/v1'),
    STORAGE_SIGNING_SECRET: z.string().min(32).optional(),
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET: z.string().optional(),
    /** Requests per minute and per IP address on every route (stricter limits on sign-in and public forms). */
    THROTTLE_LIMIT: z.coerce.number().int().positive().default(300),
    THROTTLE_ENABLED: bool(true),
    /** Proxies whose X-Forwarded-For is trusted for the client address (Express "trust proxy"): the Next.js server and the host's load balancer. */
    TRUST_PROXY: z.string().default('loopback, linklocal, uniquelocal'),
    SWAGGER_ENABLED: z.enum(['true', 'false', '1', '0']).optional(),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  })
  .transform((env) => ({
    ...env,
    COOKIE_SECURE: env.COOKIE_SECURE ? ['true', '1'].includes(env.COOKIE_SECURE) : env.NODE_ENV === 'production',
    SWAGGER_ENABLED: env.SWAGGER_ENABLED ? ['true', '1'].includes(env.SWAGGER_ENABLED) : env.NODE_ENV !== 'production',
  }))
  .superRefine((env, ctx) => {
    if (env.MAIL_TRANSPORT === 'brevo' && !env.BREVO_API_KEY) {
      ctx.addIssue({ code: 'custom', path: ['BREVO_API_KEY'], message: 'required when MAIL_TRANSPORT=brevo' });
    }
    if (env.STORAGE_DRIVER === 'r2') {
      for (const key of ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET'] as const) {
        if (!env[key]) ctx.addIssue({ code: 'custom', path: [key], message: 'required when STORAGE_DRIVER=r2' });
      }
    }
    if (env.NODE_ENV === 'production' && env.STORAGE_DRIVER === 'local') {
      ctx.addIssue({ code: 'custom', path: ['STORAGE_DRIVER'], message: 'must be r2 in production' });
    }
    if (env.NODE_ENV === 'production' && !env.TURNSTILE_SECRET_KEY) {
      ctx.addIssue({ code: 'custom', path: ['TURNSTILE_SECRET_KEY'], message: 'required in production' });
    }
  });

export type Env = z.infer<typeof envSchema>;
