import { loadEnv } from './config';

const valid = {
  DATABASE_URL: 'postgresql://centre:centre@localhost:5432/centre_dev',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
};

describe('loadEnv', () => {
  it('applies defaults to a minimal valid environment', () => {
    const env = loadEnv(valid);
    expect(env.PORT).toBe(3000);
    expect(env.COOKIE_SECURE).toBe(false);
    expect(env.SWAGGER_ENABLED).toBe(true);
  });

  it('refuses to start when a required variable is missing', () => {
    expect(() => loadEnv({ ...valid, JWT_ACCESS_SECRET: undefined })).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('secures cookies and hides Swagger in production', () => {
    const r2 = { PAYMENTS_DRIVER: 'stripe', STRIPE_SECRET_KEY: 'sk_live_x', STRIPE_WEBHOOK_SECRET: 'whsec_real', STORAGE_DRIVER: 'r2', R2_ACCOUNT_ID: 'a', R2_ACCESS_KEY_ID: 'b', R2_SECRET_ACCESS_KEY: 'c', R2_BUCKET: 'd' };
    const env = loadEnv({ ...valid, ...r2, NODE_ENV: 'production', TURNSTILE_SECRET_KEY: 'x' });
    expect(env.COOKIE_SECURE).toBe(true);
    expect(env.SWAGGER_ENABLED).toBe(false);
  });

  it('requires R2 in production, with its credentials', () => {
    expect(() => loadEnv({ ...valid, NODE_ENV: 'production', TURNSTILE_SECRET_KEY: 'x' })).toThrow(/STORAGE_DRIVER/);
    expect(() => loadEnv({ ...valid, STORAGE_DRIVER: 'r2' })).toThrow(/R2_BUCKET/);
  });

  it('requires a Brevo key when Brevo sends the e-mails', () => {
    expect(() => loadEnv({ ...valid, MAIL_TRANSPORT: 'brevo' })).toThrow(/BREVO_API_KEY/);
  });
});
