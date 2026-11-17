import type { Metadata } from 'next';

import { PageHeader } from '@/components/backoffice/PageHeader';
import { MembersTable } from '@/features/memberships/components/MembersTable';
import { getMembers } from '@/features/memberships/queries';
import { parseListParams } from '@/lib/list-params';
import { requireRole } from '@/lib/session';

export const metadata: Metadata = { title: 'Membres' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function MembersPage({ searchParams }: Props) {
  await requireRole('ADMIN');
  const query = parseListParams(await searchParams, { filters: ['status', 'ageCategory'], defaults: { sort: 'name', order: 'asc' } });
  const data = await getMembers(query);
  return (
    <>
      <PageHeader title="Membres" description="Fiches des membres du Centre." />
      <MembersTable data={data} sort={query.sort} order={query.order} />
    </>
  );
}
