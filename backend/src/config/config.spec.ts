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
    const env = loadEnv({ ...valid, NODE_ENV: 'production', TURNSTILE_SECRET_KEY: 'x' });
    expect(env.COOKIE_SECURE).toBe(true);
    expect(env.SWAGGER_ENABLED).toBe(false);
  });

  it('requires a Brevo key when Brevo sends the e-mails', () => {
    expect(() => loadEnv({ ...valid, MAIL_TRANSPORT: 'brevo' })).toThrow(/BREVO_API_KEY/);
  });
});
