import type { MigrationInterface, QueryRunner } from 'typeorm';

/** B11-01: searchable index of the published site pages (pgvector, 1024-dimension embeddings, cosine distance). */
export class ChatbotIndex1765000000005 implements MigrationInterface {
  name = 'ChatbotIndex1765000000005';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE EXTENSION IF NOT EXISTS vector;

      CREATE TABLE app.chatbot_documents (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        -- Where the text comes from: a CMS page, identified by its Payload id.
        source_type text NOT NULL DEFAULT 'page',
        source_id text NOT NULL,
        slug text NOT NULL,
        title text NOT NULL,
        url text NOT NULL,
        content_hash text NOT NULL,
        embedding_model text NOT NULL,
        indexed_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (source_type, source_id)
      );

      CREATE TABLE app.chatbot_chunks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id uuid NOT NULL REFERENCES app.chatbot_documents (id) ON DELETE CASCADE,
        position integer NOT NULL,
        content text NOT NULL,
        embedding vector(1024) NOT NULL,
        UNIQUE (document_id, position)
      );
      CREATE INDEX chatbot_chunks_embedding_idx ON app.chatbot_chunks USING hnsw (embedding vector_cosine_ops);
    `);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE app.chatbot_chunks; DROP TABLE app.chatbot_documents;`);
  }
}
