import request from 'supertest';

import { Notification } from '../../src/database/entities';
import { clearRateLimits } from '../setup/global-setup';
import { createTestApp, type TestApp } from '../setup/app';

const message = (overrides: Record<string, unknown> = {}) => ({
  name: 'Gérard Paquette',
  email: `gerard.${Math.random().toString(36).slice(2, 8)}@exemple.ca`,
  subject: 'Inscription aux ateliers',
  message: 'Bonjour, est-ce qu’il reste de la place pour l’atelier de tablette ?',
  turnstileToken: 'dev-token',
  ...overrides,
});

describe('POST /contact (B2-05)', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  beforeEach(clearRateLimits);
  afterAll(() => t.app.close());

  const send = (body: Record<string, unknown>) => request(t.http).post('/api/v1/contact').send(body);

  it('queues an e-mail to the centre with the sender as reply-to and stores nothing else', async () => {
    const body = message({ phone: '514 555-0123' });
    const res = await send(body).expect(200);
    expect(res.body).toEqual({ received: true });
    const mail = await t.dataSource.getRepository(Notification).findOneOrFail({ where: { type: 'CONTACT_MESSAGE' }, order: { createdAt: 'DESC' } });
    expect(mail).toMatchObject({ recipient: 'info@lesaines.test', data: { email: body.email, phone: '514 555-0123', subject: body.subject } });
    expect(mail.data).not.toHaveProperty('turnstileToken');
  });

  it('validates the form in French and requires the anti-robot token', async () => {
    const res = await send(message({ email: 'non', message: 'court', turnstileToken: '' })).expect(422);
    expect(res.body.details.map((d: { field: string }) => d.field)).toEqual(expect.arrayContaining(['email', 'message', 'turnstileToken']));
  });

  it('limits one sender to 3 messages a minute', async () => {
    const body = message();
    for (let i = 0; i < 3; i += 1) await send({ ...body, subject: `Question ${i}` }).expect(200);
    const res = await send(body).expect(429);
    expect(res.body.code).toBe('TOO_MANY_REQUESTS');
  });

  it('limits one address to 5 messages a minute', async () => {
    for (let i = 0; i < 5; i += 1) await send(message()).expect(200);
    await send(message()).expect(429);
  });
});
