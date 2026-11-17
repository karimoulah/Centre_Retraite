import 'server-only';

import { api } from '@/lib/api/api';
import type { ListQuery, Member, MembershipRequest, MembershipSettings, Paginated } from '@/lib/api/contracts';

export const getMembershipRequests = (query: ListQuery & { status?: string }) =>
  api<Paginated<MembershipRequest>>('/memberships', { query });
export const getMembershipRequest = (id: string) => api<MembershipRequest>(`/memberships/${encodeURIComponent(id)}`);
export const getMembershipSettings = () => api<MembershipSettings>('/settings/membership');
export const getMembers = (query: ListQuery & { status?: string; ageCategory?: string }) =>
  api<Paginated<Member>>('/members', { query });
export const getMember = (id: string) => api<Member>(`/members/${encodeURIComponent(id)}`);
