# Tests

- **Unit tests** (`pnpm test`): `src/**/*.spec.ts`, no database.
- **End-to-end tests** (`pnpm test:e2e`): `test/e2e/*.e2e-spec.ts`, run against the real `AppModule`, a PostgreSQL
  test database and Redis. Start them with `docker compose up -d postgres-test redis` (test database on port 5433).
  The schema is dropped before each run and rebuilt by the migrations.

Helpers:

- `createTestApp()` (`test/setup/app.ts`): the application with the production pipeline (prefix, cookies, guards, filters).
- `createUser()` (`test/factories/users.ts`): a user with roles and the password `TEST_PASSWORD`, unique e-mail every call.
- `loginAs(t, 'ADMIN')` and `as(t, session).get('/users')` (`test/setup/auth.ts`): sign in through `POST /auth/login`
  and send requests with the session cookies.

Every new module adds its own `test/e2e/<module>.e2e-spec.ts` on this model.
