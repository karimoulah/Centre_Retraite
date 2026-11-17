import type { Metadata } from 'next';

import { PageHeader } from '@/components/backoffice/PageHeader';
import { MembershipRequestsTable } from '@/features/memberships/components/MembershipRequestsTable';
import { getMembershipRequests } from '@/features/memberships/queries';
import { parseListParams } from '@/lib/list-params';
import { requireRole } from '@/lib/session';

export const metadata: Metadata = { title: "Demandes d'adhésion" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function MembershipRequestsPage({ searchParams }: Props) {
  await requireRole('ADMIN');
  const query = parseListParams(await searchParams, { filters: ['status'], defaults: { status: 'PENDING', sort: 'submittedAt', order: 'desc' } });
  const data = await getMembershipRequests(query);
  return (
    <>
      <PageHeader title="Demandes d’adhésion" description="Par défaut, seules les demandes en attente sont affichées." />
      <MembershipRequestsTable data={data} sort={query.sort} order={query.order} />
    </>
  );
}
