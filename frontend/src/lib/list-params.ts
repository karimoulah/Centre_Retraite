import type { ListQuery } from '@/lib/api/contracts';

export const PAGE_SIZES = [10, 25, 50] as const;

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** Reads ?page, ?pageSize, ?sort, ?order, ?q and any extra filter keys from the URL. */
export function parseListParams<TFilter extends string = never>(
  searchParams: SearchParams,
  options: { filters?: readonly TFilter[]; defaults?: Partial<Record<TFilter, string>> & Partial<ListQuery> } = {},
): ListQuery & Partial<Record<TFilter, string>> {
  const page = Math.max(1, Number(first(searchParams.page)) || 1);
  const size = Number(first(searchParams.pageSize));
  const pageSize = (PAGE_SIZES as readonly number[]).includes(size) ? size : (options.defaults?.pageSize ?? 25);
  const order = first(searchParams.order) === 'desc' ? 'desc' : first(searchParams.order) === 'asc' ? 'asc' : options.defaults?.order;
  const result = {
    page,
    pageSize,
    sort: first(searchParams.sort) ?? options.defaults?.sort,
    order,
    q: first(searchParams.q)?.trim() || undefined,
  } as ListQuery & Partial<Record<TFilter, string>>;
  for (const key of options.filters ?? []) {
    const value = first(searchParams[key]) ?? options.defaults?.[key];
    if (value && value !== 'all') (result as Record<string, unknown>)[key] = value;
  }
  return result;
}
