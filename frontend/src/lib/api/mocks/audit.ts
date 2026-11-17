import type { AuditEntry } from '../contracts';
import { guard, isResponse } from './auth';
import { mockStore, ok, paginate, type MockRoute } from './types';

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();

export const auditLog = () =>
  mockStore<AuditEntry[]>('audit', () => [
    { id: 'a-seed-1', at: hoursAgo(3), actor: { id: 'u-admin', name: 'Aminata Diallo' }, action: 'MEMBERSHIP_APPROVED', entityType: 'MembershipRequest', entityId: 'r-4', entityLabel: 'Paulette Gingras', before: { status: 'PENDING' }, after: { status: 'APPROVED' } },
    { id: 'a-seed-2', at: hoursAgo(26), actor: { id: 'u-admin', name: 'Aminata Diallo' }, action: 'USER_ROLES_CHANGED', entityType: 'User', entityId: 'u-multi', entityLabel: 'Claire Bouchard', before: { roles: ['ADMIN'] }, after: { roles: ['ADMIN', 'FINANCE'] } },
    { id: 'a-seed-3', at: hoursAgo(50), actor: { id: 'u-admin', name: 'Aminata Diallo' }, action: 'MEMBERSHIP_REJECTED', entityType: 'MembershipRequest', entityId: 'r-5', entityLabel: 'Test Robot', before: { status: 'PENDING' }, after: { status: 'REJECTED', reason: 'Demande en double.' } },
    { id: 'a-seed-4', at: hoursAgo(72), actor: { id: 'u-member', name: 'Robert Lavoie' }, action: 'CONSENTS_UPDATED', entityType: 'Member', entityId: 'm-member', entityLabel: 'Robert Lavoie', before: { testimonialPublication: false }, after: { testimonialPublication: true } },
  ]);

/** Every mock mutation records who changed what, like the API's audit interceptor. */
export function recordAudit(entry: Omit<AuditEntry, 'id' | 'at'>) {
  auditLog().unshift({ ...entry, id: `a-${auditLog().length + 1}`, at: new Date().toISOString() });
}

export const auditRoutes: MockRoute[] = [
  {
    method: 'GET',
    path: '/audit-logs',
    handler: (request) => {
      const me = guard(request, 'ADMIN');
      if (isResponse(me)) return me;
      const { query } = request;
      const entityType = query.get('entityType');
      const actorId = query.get('actorId');
      const from = query.get('from');
      const to = query.get('to');
      const items = auditLog().filter(
        (entry) =>
          (!entityType || entry.entityType === entityType) &&
          (!actorId || entry.actor?.id === actorId) &&
          (!from || entry.at.slice(0, 10) >= from) &&
          (!to || entry.at.slice(0, 10) <= to),
      );
      const params = new URLSearchParams(query);
      if (!params.get('sort')) params.set('sort', 'at');
      if (!params.get('order')) params.set('order', 'desc');
      return ok(paginate(items as unknown as Record<string, unknown>[], params, ['entityLabel', 'action']));
    },
  },
];
