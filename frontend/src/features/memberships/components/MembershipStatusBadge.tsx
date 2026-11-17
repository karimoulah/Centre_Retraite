import { StatusBadge } from '@/components/backoffice/StatusBadge';
import { MEMBERSHIP_STATUS_LABELS, type MembershipStatus } from '@/lib/api/contracts';

const tone = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'error' } as const;

export function MembershipStatusBadge({ status }: { status: MembershipStatus }) {
  return <StatusBadge tone={tone[status]}>{MEMBERSHIP_STATUS_LABELS[status]}</StatusBadge>;
}
