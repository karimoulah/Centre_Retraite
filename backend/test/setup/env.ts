// Test environment: the separate test database (docker compose: postgres-test on port 5433).
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://centre:centre@localhost:5433/centre_test';
process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-0123456789abcdef';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-0123456789abcdef';
process.env.MAIL_TRANSPORT = 'memory';
process.env.LOG_LEVEL = 'silent';
process.env.TURNSTILE_SECRET_KEY = '';
/** Request limits are tested in security.e2e-spec.ts only; elsewhere they would make tests depend on each other. */
process.env.THROTTLE_ENABLED ??= 'false';
process.env.STORAGE_LOCAL_DIR ??= '/tmp/lesaines-test-storage';
