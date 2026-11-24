import type { DataSource } from 'typeorm';

import { Category, Entry, type EntryDirection } from '../../src/database/entities';

let n = 0;
export async function createCategory(ds: DataSource, direction: EntryDirection, overrides: Partial<Category> = {}) {
  n += 1;
  const repo = ds.getRepository(Category);
  return repo.save(repo.create({ name: `Catégorie ${direction} ${n} ${Date.now()}`, direction, ...overrides }));
}

/** An entry inserted directly (DRAFT unless told otherwise). */
export async function createEntry(ds: DataSource, overrides: Partial<Entry> & { direction?: EntryDirection } = {}) {
  const direction = overrides.direction ?? 'INCOME';
  const categoryId = overrides.categoryId ?? (await createCategory(ds, direction)).id;
  const repo = ds.getRepository(Entry);
  const saved = await repo.save(
    repo.create({
      direction,
      amountCents: 2500,
      entryDate: '2026-11-20',
      paymentMethod: 'CASH',
      description: 'Écriture de test',
      ...overrides,
      categoryId,
    }),
  );
  return repo.findOneByOrFail({ id: saved.id });
}

export const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
