import 'server-only';

import { api } from '@/lib/api/api';
import type {
  Category,
  Contributor,
  EntriesPage,
  EntriesQuery,
  EntryDetail,
  EntryDirection,
  ListQuery,
  Paginated,
} from '@/lib/api/contracts';

export const getCategories = (
  query: { direction?: EntryDirection; active?: 'true' | 'false' } = {},
) => api<Category[]>('/categories', { query });
export const getContributors = (query: ListQuery & { kind?: string }) =>
  api<Paginated<Contributor>>('/contributors', { query });
export const getContributor = (id: string) =>
  api<Contributor>(`/contributors/${encodeURIComponent(id)}`);
export const getEntries = (query: EntriesQuery) => api<EntriesPage>('/entries', { query });
export const getEntry = (id: string) => api<EntryDetail>(`/entries/${encodeURIComponent(id)}`);
