import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/backoffice/PageHeader';
import { UserEditor } from '@/features/users/components/UserEditor';
import { UserStatusBadge } from '@/features/users/components/UserStatusBadge';
import { getUser } from '@/features/users/queries';
import { isApiError } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/format';
import { requireRole } from '@/lib/session';

export const metadata: Metadata = { title: 'Utilisateur' };

type Props = { params: Promise<{ id: string }> };

export default async function UserPage({ params }: Props) {
  const me = await requireRole('ADMIN');
  const { id } = await params;
  const user = await getUser(id).catch((error) => {
    if (isApiError(error) && error.status === 404) notFound();
    throw error;
  });

  return (
    <>
      <PageHeader
        title={`${user.firstName} ${user.lastName}`}
        description={
          <span className="flex flex-wrap items-center gap-3">
            <UserStatusBadge user={user} />
            <span>Créé le {formatDateTime(user.createdAt)}</span>
            <span>{user.lastLoginAt ? `Dernière connexion : ${formatDateTime(user.lastLoginAt)}` : 'Jamais connecté'}</span>
          </span>
        }
      />
      <UserEditor key={user.id} user={user} isSelf={user.id === me.id} />
    </>
  );
}
