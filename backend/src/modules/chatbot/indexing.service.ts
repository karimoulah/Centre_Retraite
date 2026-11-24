import { createHash } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

import type { SyncedPage } from './chatbot.constants';
import { EmbeddingsProvider, toPgVector } from './embeddings';
import { chunk, extractText } from './text';

export type IndexResult = 'indexed' | 'unchanged' | 'empty' | 'deleted';

/** Keeps app.chatbot_documents / app.chatbot_chunks in step with the published pages (run by the worker). */
@Injectable()
export class IndexingService {
  private readonly logger = new Logger(IndexingService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly embeddings: EmbeddingsProvider,
  ) {}

  /** Extract, chunk, embed and replace the page's chunks in one transaction. Skipped when nothing changed. */
  async index(page: SyncedPage): Promise<IndexResult> {
    const text = extractText(page);
    const hash = createHash('sha256').update(`${page.title}\n${page.url}\n${text}`).digest('hex');
    const existing: { id: string; content_hash: string; embedding_model: string }[] =
      await this.dataSource.query(
        `SELECT id, content_hash, embedding_model FROM app.chatbot_documents WHERE source_type = 'page' AND source_id = $1`,
        [page.id],
      );
    if (existing[0]?.content_hash === hash && existing[0].embedding_model === this.embeddings.model)
      return 'unchanged';

    const chunks = chunk(page.title, text);
    if (!chunks.length) {
      await this.remove(page.id);
      return 'empty';
    }
    const vectors = await this.embeddings.embed(chunks, 'document');
    await this.dataSource.transaction(async (m) => {
      const [document]: { id: string }[] = await m.query(
        `INSERT INTO app.chatbot_documents (source_type, source_id, slug, title, url, content_hash, embedding_model, indexed_at)
         VALUES ('page', $1, $2, $3, $4, $5, $6, now())
         ON CONFLICT (source_type, source_id) DO UPDATE
           SET slug = EXCLUDED.slug, title = EXCLUDED.title, url = EXCLUDED.url, content_hash = EXCLUDED.content_hash,
               embedding_model = EXCLUDED.embedding_model, indexed_at = now()
         RETURNING id`,
        [page.id, page.slug, page.title, page.url, hash, this.embeddings.model],
      );
      await m.query(`DELETE FROM app.chatbot_chunks WHERE document_id = $1`, [document.id]);
      for (const [position, content] of chunks.entries()) {
        await m.query(
          `INSERT INTO app.chatbot_chunks (document_id, position, content, embedding) VALUES ($1, $2, $3, $4::vector)`,
          [document.id, position, content, toPgVector(vectors[position])],
        );
      }
    });
    this.logger.log(`Page ${page.slug} indexed (${chunks.length} chunks)`);
    return 'indexed';
  }

  /** Unpublished or deleted page: its chunks go with it (cascade). */
  async remove(sourceId: string): Promise<IndexResult> {
    await this.dataSource.query(
      `DELETE FROM app.chatbot_documents WHERE source_type = 'page' AND source_id = $1`,
      [sourceId],
    );
    return 'deleted';
  }

  /** Closest chunks to a question (cosine). Used by the assistant in sprint 3. */
  async search(question: string, limit = 5) {
    const [vector] = await this.embeddings.embed([question], 'query');
    const rows: { content: string; title: string; url: string; score: number }[] =
      await this.dataSource.query(
        `SELECT c.content, d.title, d.url, 1 - (c.embedding <=> $1::vector) AS score
         FROM app.chatbot_chunks c JOIN app.chatbot_documents d ON d.id = c.document_id
        ORDER BY c.embedding <=> $1::vector
        LIMIT $2`,
        [toPgVector(vector), limit],
      );
    return rows.map((r) => ({ ...r, score: Number(r.score) }));
  }
}
