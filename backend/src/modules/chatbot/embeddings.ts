import { Logger } from '@nestjs/common';

import type { Env } from '../../config/config.module';

export const EMBEDDING_DIMENSIONS = 1024;
export type EmbeddingPurpose = 'document' | 'query';

/** Turns texts into 1024-dimension vectors. Changing the model means re-indexing everything. */
export abstract class EmbeddingsProvider {
  abstract readonly model: string;
  abstract embed(texts: string[], purpose: EmbeddingPurpose): Promise<number[][]>;
}

/** Voyage AI (T-11): multilingual, 1024 dimensions. */
export class VoyageEmbeddings extends EmbeddingsProvider {
  readonly model = 'voyage-4';
  private readonly logger = new Logger(VoyageEmbeddings.name);

  constructor(private readonly env: Env) {
    super();
  }

  async embed(texts: string[], purpose: EmbeddingPurpose): Promise<number[][]> {
    const response = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: { authorization: `Bearer ${this.env.VOYAGE_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        input: texts,
        input_type: purpose,
        output_dimension: EMBEDDING_DIMENSIONS,
      }),
    });
    if (!response.ok) {
      this.logger.warn(`Voyage ${response.status}`);
      throw new Error(`Voyage embeddings failed: HTTP ${response.status}`);
    }
    const body = (await response.json()) as { data: { index: number; embedding: number[] }[] };
    return body.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
  }
}

const words = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3);

/** FNV-1a, 32 bits. */
function hash(word: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < word.length; i += 1) h = Math.imul(h ^ word.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

/**
 * Development and tests: a hashed bag of words, normalized. No network, no key, and texts sharing
 * words are close, so search behaves sensibly in tests. Not a language model.
 */
export class FakeEmbeddings extends EmbeddingsProvider {
  readonly model = 'fake-bag-of-words';

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((text) => {
      const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
      for (const word of words(text)) {
        // Light stemming so "activité" and "activités" meet.
        vector[hash(word.replace(/s$/, '')) % EMBEDDING_DIMENSIONS] += 1;
      }
      const norm = Math.hypot(...vector) || 1;
      return vector.map((v) => v / norm);
    });
  }
}

export const toPgVector = (v: number[]) => `[${v.join(',')}]`;
