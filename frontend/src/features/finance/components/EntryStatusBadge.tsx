import { StatusBadge, type StatusTone } from '@/components/backoffice/StatusBadge';
import { ENTRY_STATUS_LABELS, type EntryStatus } from '@/lib/api/contracts';

const tones: Record<EntryStatus, StatusTone> = {
  DRAFT: 'neutral',
  SUBMITTED: 'warning',
  APPROVED: 'info',
  REJECTED: 'error',
  VALIDATED: 'success',
};

export function EntryStatusBadge({ status }: { status: EntryStatus }) {
  return <StatusBadge tone={tones[status]}>{ENTRY_STATUS_LABELS[status]}</StatusBadge>;
}
