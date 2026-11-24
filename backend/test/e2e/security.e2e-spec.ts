import request from 'supertest';

import { createTestApp, type TestApp } from '../setup/app';

describe('Security headers, CSRF origin check and request limits (B13-01)', () => {
  let t: TestApp;
  beforeAll(async () => {
    process.env.THROTTLE_ENABLED = 'true';
    process.env.THROTTLE_LIMIT = '30';
    t = await createTestApp();
  });
  afterAll(async () => {
    process.env.THROTTLE_ENABLED = 'false';
    await t.app.close();
  });

  it('sends the helmet headers and the CORS answer for the frontend only', async () => {
    const res = await request(t.http).get('/api/v1/health').set('Origin', 'http://localhost:5173');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
    const foreign = await request(t.http).get('/api/v1/health').set('Origin', 'https://pirate.example');
    expect(foreign.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('refuses a write coming from another site', async () => {
    const res = await request(t.http)
      .post('/api/v1/auth/logout')
      .set('Origin', 'https://pirate.example')
      .expect(403);
    expect(res.body.code).toBe('FORBIDDEN_ORIGIN');
    await request(t.http).post('/api/v1/auth/password/forgot').set('Origin', 'http://localhost:5173').send({ email: 'a@exemple.ca' }).expect(200);
  });

  it('limits sign-in attempts to 10 a minute per address', async () => {
    const attempts = [];
    for (let i = 0; i < 11; i += 1) {
      attempts.push((await request(t.http).post('/api/v1/auth/login').send({ email: `x${i}@exemple.ca`, password: 'Mauvais123456' })).status);
    }
    expect(attempts.slice(0, 10).every((s) => s === 401)).toBe(true);
    expect(attempts[10]).toBe(429);
  });

  it('applies the global limit to every route', async () => {
    let last = 200;
    for (let i = 0; i < 31 && last !== 429; i += 1) last = (await request(t.http).get('/api/v1/health')).status;
    expect(last).toBe(429);
  });
});
