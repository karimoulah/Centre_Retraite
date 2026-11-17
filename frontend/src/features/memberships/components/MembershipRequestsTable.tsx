'use client';

import Link from 'next/link';

import { DataTable, DataTableFilter, DataTableSearch, type DataTableColumn } from '@/components/backoffice/data-table';
import { AGE_CATEGORY_LABELS, MEMBERSHIP_STATUS_LABELS, type MembershipRequest, type Paginated } from '@/lib/api/contracts';
import { formatDateTime } from '@/lib/format';

import { MembershipStatusBadge } from './MembershipStatusBadge';

const columns: DataTableColumn<MembershipRequest>[] = [
  {
    id: 'name',
    header: 'Personne',
    meta: { label: 'Personne', sortKey: 'name' },
    enableHiding: false,
    cell: ({ row }) => (
      <Link href={`/backoffice/memberships/${row.original.id}`} className="font-medium underline-offset-4 hover:underline">
        {row.original.firstName} {row.original.lastName}
      </Link>
    ),
  },
  { id: 'email', header: 'Courriel', meta: { label: 'Courriel' }, cell: ({ row }) => row.original.email },
  { id: 'age', header: 'Âge', meta: { label: 'Âge' }, cell: ({ row }) => AGE_CATEGORY_LABELS[row.original.ageCategory] },
  { id: 'submittedAt', header: 'Reçue le', meta: { label: 'Reçue le', sortKey: 'submittedAt' }, cell: ({ row }) => formatDateTime(row.original.submittedAt) },
  { id: 'status', header: 'Statut', meta: { label: 'Statut' }, cell: ({ row }) => <MembershipStatusBadge status={row.original.status} /> },
];

export function MembershipRequestsTable({ data, sort, order }: { data: Paginated<MembershipRequest>; sort?: string; order?: 'asc' | 'desc' }) {
  return (
    <DataTable
      caption="Demandes d’adhésion"
      columns={columns}
      data={data.items}
      total={data.total}
      page={data.page}
      pageSize={data.pageSize}
      sort={sort}
      order={order}
      getRowId={(row) => row.id}
      toolbar={
        <>
          <DataTableSearch placeholder="Nom ou courriel" />
          <DataTableFilter
            param="status"
            label="Statut"
            defaultValue="PENDING"
            allLabel="Toutes"
            options={(['PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => ({ value: s, label: MEMBERSHIP_STATUS_LABELS[s] }))}
          />
        </>
      }
      empty={{ title: 'Aucune demande à traiter', description: 'Les nouvelles demandes d’adhésion apparaîtront ici.' }}
    />
  );
}
