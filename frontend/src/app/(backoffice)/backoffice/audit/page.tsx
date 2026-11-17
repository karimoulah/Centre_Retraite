import type { Metadata } from 'next';

import { PageHeader } from '@/components/backoffice/PageHeader';
import { AuditTable } from '@/features/audit/components/AuditTable';
import { getUsers } from '@/features/users/queries';
import { api } from '@/lib/api/api';
import type { AuditEntry, Paginated } from '@/lib/api/contracts';
import { parseListParams } from '@/lib/list-params';
import { requireRole } from '@/lib/session';

export const metadata: Metadata = { title: "Journal d'audit" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AuditPage({ searchParams }: Props) {
  await requireRole('ADMIN');
  const query = parseListParams(await searchParams, { filters: ['entityType', 'actorId', 'from', 'to'], defaults: { sort: 'at', order: 'desc' } });
  const [data, users] = await Promise.all([
    api<Paginated<AuditEntry>>('/audit-logs', { query }),
    getUsers({ pageSize: 50, sort: 'name', order: 'asc' }),
  ]);
  const actors = users.items.map((u) => ({ value: u.id, label: `${u.firstName} ${u.lastName}` }));
  return (
    <>
      <PageHeader title="Journal d’audit" description="Toutes les modifications faites sur la plateforme, avec leur auteur et les valeurs avant et après. Le journal ne peut pas être modifié." />
      <AuditTable data={data} sort={query.sort} order={query.order} actors={actors} />
    </>
  );
}
