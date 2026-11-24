import type { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

import { z } from './zod';

export const PAGE_SIZES = [10, 25, 50, 100] as const;

/** ?page, ?pageSize, ?sort, ?order, ?q — accepted by every list route. */
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sort: z.string().max(40).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  q: z.string().trim().max(100).optional(),
});
export type ListQuery = z.infer<typeof listQuerySchema>;

export type Paginated<T> = { items: T[]; total: number; page: number; pageSize: number; limit: number };

type ListOptions = {
  /** Public sort key → SQL expression; unknown keys fall back to the default. */
  sortable: Record<string, string>;
  defaultSort: { key: string; order: 'asc' | 'desc' };
  /** SQL expressions searched with ILIKE when ?q is given. */
  search?: string[];
};

/** Applies search, sort and pagination to a query builder, then returns { items, total, page, pageSize }. */
export async function paginate<E extends ObjectLiteral, T = E>(
  qb: SelectQueryBuilder<E>,
  query: ListQuery,
  options: ListOptions,
  map: (entity: E) => T = (entity) => entity as unknown as T,
): Promise<Paginated<T>> {
  if (query.q && options.search?.length) {
    qb.andWhere(`(${options.search.map((column) => `${column} ILIKE :q`).join(' OR ')})`, { q: `%${query.q}%` });
  }
  const sortKey = query.sort && options.sortable[query.sort] ? query.sort : options.defaultSort.key;
  const order = (query.order ?? (sortKey === options.defaultSort.key ? options.defaultSort.order : 'asc')).toUpperCase() as
    | 'ASC'
    | 'DESC';
  qb.orderBy(options.sortable[sortKey], order, 'NULLS LAST');
  qb.skip((query.page - 1) * query.pageSize).take(query.pageSize);
  const [entities, total] = await qb.getManyAndCount();
  return { items: entities.map(map), total, page: query.page, pageSize: query.pageSize, limit: query.pageSize };
}
