import type { AuditEntry } from '../contracts';
import { mockStore } from './types';

export const auditLog = () => mockStore<AuditEntry[]>('audit', () => []);

/** Every mock mutation records who changed what, like the API's audit interceptor. */
export function recordAudit(entry: Omit<AuditEntry, 'id' | 'at'>) {
  auditLog().unshift({ ...entry, id: `a-${auditLog().length + 1}`, at: new Date().toISOString() });
}
