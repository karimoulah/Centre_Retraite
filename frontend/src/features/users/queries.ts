import 'server-only';

import { api } from '@/lib/api/api';
import type { ListQuery, Paginated, UserAccount } from '@/lib/api/contracts';

export const getUsers = (query: ListQuery & { role?: string; status?: string }) =>
  api<Paginated<UserAccount>>('/users', { query });

export const getUser = (id: string) => api<UserAccount>(`/users/${encodeURIComponent(id)}`);
