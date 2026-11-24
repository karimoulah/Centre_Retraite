import { createHmac } from 'node:crypto';

import { getQueueToken } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import request from 'supertest';

import { CHATBOT_QUEUE } from '../../src/modules/chatbot/chatbot.constants';
import { EmbeddingsProvider } from '../../src/modules/chatbot/embeddings';
import { IndexingService } from '../../src/modules/chatbot/indexing.service';
import { createTestApp, type TestApp } from '../setup/app';

const SECRET = 'local-development-chatbot-sync-secret';
const rich = (...paragraphs: string[]) => ({
  root: {
    type: 'root',
    children: paragraphs.map((text) => ({ type: 'paragraph', children: [{ type: 'text', text }] })),
  },
});
const page = (id: string, title: string, ...paragraphs: string[]) => ({
  id,
  slug: title.toLowerCase().replace(/\W+/g, '-'),
  title,
  url: `/${id}`,
  layout: [{ blockType: 'content', title, body: rich(...paragraphs) }],
});

describe('Indexing the site for the assistant (B11-01)', () => {
  let t: TestApp;
  let indexing: IndexingService;
  beforeAll(async () => {
    t = await createTestApp();
    indexing = t.app.get(IndexingService);
  });
  afterAll(() => t.app.close());

  const post = (body: object, secret = SECRET) => {
    const raw = JSON.stringify(body);
    return request(t.http)
      .post('/api/v1/internal/chatbot/sync')
      .set('content-type', 'application/json')
      .set('x-signature', `sha256=${createHmac('sha256', secret).update(raw).digest('hex')}`)
      .send(raw);
  };

  it('accepts a signed notification from Payload and queues it at once', async () => {
    const queue = t.app.get<Queue>(getQueueToken(CHATBOT_QUEUE));
    const res = await post({
      event: 'upsert',
      page: page('p-sync', 'Activités', 'Cafés-rencontres le mardi.'),
    }).expect(202);
    expect(res.body).toEqual({ queued: true });
    const jobs = await queue.getJobs(['waiting', 'delayed', 'active']);
    const job = jobs.find((j) => j.data.page.id === 'p-sync');
    expect(job?.opts.delay ?? 0).toBe(0);
    await queue.obliterate({ force: true });
  });

  it('refuses an unsigned or forged notification', async () => {
    await post({ event: 'delete', page: { id: 'p1' } }, 'mauvais-secret-mauvais-secret-mauvais').expect(401);
    await request(t.http)
      .post('/api/v1/internal/chatbot/sync')
      .send({ event: 'delete', page: { id: 'p1' } })
      .expect(401);
  });

  it('indexes a page in chunks with 1024-dimension vectors and finds it from a question', async () => {
    expect(
      await indexing.index(
        page(
          'p-activites',
          'Nos activités',
          'Le café-rencontre a lieu tous les mardis matin dans la salle communautaire.',
          'Les ateliers numériques apprennent la tablette et les appels vidéo.',
        ),
      ),
    ).toBe('indexed');
    await indexing.index(
      page(
        'p-dons',
        'Soutenir le Centre',
        'Vos dons financent les activités. Un reçu fiscal est remis pour chaque don admissible.',
      ),
    );
    const rows = await t.dataSource.query(
      `SELECT vector_dims(embedding) AS dims FROM app.chatbot_chunks c JOIN app.chatbot_documents d ON d.id = c.document_id WHERE d.source_id = 'p-activites'`,
    );
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].dims).toBe(1024);

    const [best] = await indexing.search('Est-ce que je peux avoir un reçu fiscal pour mon don ?');
    expect(best).toMatchObject({ title: 'Soutenir le Centre', url: '/p-dons' });
    const [tablet] = await indexing.search('apprendre la tablette');
    expect(tablet.title).toBe('Nos activités');
  });

  it('does not re-embed an unchanged page, and replaces the chunks of a changed one', async () => {
    const embed = jest.spyOn(t.app.get(EmbeddingsProvider), 'embed');
    const p = page('p-horaire', 'Horaire', 'Ouvert du lundi au vendredi, de 9 h à 17 h.');
    await indexing.index(p);
    embed.mockClear();
    expect(await indexing.index(p)).toBe('unchanged');
    expect(embed).not.toHaveBeenCalled();
    expect(
      await indexing.index(page('p-horaire', 'Horaire', 'Ouvert du lundi au jeudi, de 9 h à 16 h.')),
    ).toBe('indexed');
    const chunks = await t.dataSource.query(
      `SELECT content FROM app.chatbot_chunks c JOIN app.chatbot_documents d ON d.id = c.document_id WHERE d.source_id = 'p-horaire'`,
    );
    expect(chunks.map((c: { content: string }) => c.content).join()).toContain('jeudi');
    expect(chunks.map((c: { content: string }) => c.content).join()).not.toContain('vendredi');
  });

  it('removes an unpublished page from the index', async () => {
    await indexing.index(page('p-retiree', 'Page retirée', 'Contenu qui ne doit plus répondre.'));
    expect(await indexing.remove('p-retiree')).toBe('deleted');
    const left = await t.dataSource.query(
      `SELECT count(*)::int AS n FROM app.chatbot_documents WHERE source_id = 'p-retiree'`,
    );
    expect(left[0].n).toBe(0);
  });
});
