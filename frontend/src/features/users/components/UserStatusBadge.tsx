import { StatusBadge } from '@/components/backoffice/StatusBadge';
import type { UserAccount } from '@/lib/api/contracts';

export function UserStatusBadge({ user }: { user: Pick<UserAccount, 'active' | 'invitationPending'> }) {
  if (!user.active) return <StatusBadge tone="neutral">Désactivé</StatusBadge>;
  if (user.invitationPending) return <StatusBadge tone="info">Invitation envoyée</StatusBadge>;
  return <StatusBadge tone="success">Actif</StatusBadge>;
}
