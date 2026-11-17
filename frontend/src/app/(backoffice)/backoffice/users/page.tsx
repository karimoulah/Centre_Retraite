import type { Metadata } from 'next';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';

import { PageHeader } from '@/components/backoffice/PageHeader';
import { Button } from '@/components/ui/button';
import { UsersTable } from '@/features/users/components/UsersTable';
import { getUsers } from '@/features/users/queries';
import { parseListParams } from '@/lib/list-params';
import { requireRole } from '@/lib/session';

export const metadata: Metadata = { title: 'Utilisateurs' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function UsersPage({ searchParams }: Props) {
  await requireRole('ADMIN');
  const query = parseListParams(await searchParams, { filters: ['role', 'status'], defaults: { sort: 'name', order: 'asc' } });
  const data = await getUsers(query);
  return (
    <>
      <PageHeader
        title="Utilisateurs"
        description="Comptes de l’équipe et des membres, rôles et accès."
        actions={
          <Button asChild>
            <Link href="/backoffice/users/new">
              <UserPlus aria-hidden />
              Inviter un utilisateur
            </Link>
          </Button>
        }
      />
      <UsersTable data={data} sort={query.sort} order={query.order} />
    </>
  );
}
