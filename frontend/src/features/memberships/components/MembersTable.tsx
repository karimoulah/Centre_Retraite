'use client';

import Link from 'next/link';

import { StatusBadge } from '@/components/backoffice/StatusBadge';
import { DataTable, DataTableFilter, DataTableSearch, type DataTableColumn } from '@/components/backoffice/data-table';
import { AGE_CATEGORIES, AGE_CATEGORY_LABELS, type Member, type Paginated } from '@/lib/api/contracts';
import { formatDate } from '@/lib/format';

const columns: DataTableColumn<Member>[] = [
  { id: 'memberNumber', header: 'N°', meta: { label: 'Numéro', sortKey: 'memberNumber' }, cell: ({ row }) => <span className="tabular-nums">{row.original.memberNumber}</span> },
  {
    id: 'name',
    header: 'Nom',
    meta: { label: 'Nom', sortKey: 'name' },
    enableHiding: false,
    cell: ({ row }) => (
      <Link href={`/backoffice/members/${row.original.id}`} className="font-medium underline-offset-4 hover:underline">
        {row.original.firstName} {row.original.lastName}
      </Link>
    ),
  },
  { id: 'email', header: 'Courriel', meta: { label: 'Courriel' }, cell: ({ row }) => row.original.email },
  { id: 'phone', header: 'Téléphone', meta: { label: 'Téléphone' }, cell: ({ row }) => row.original.phone ?? <span className="text-text-muted">—</span> },
  { id: 'age', header: 'Âge', meta: { label: 'Âge' }, cell: ({ row }) => AGE_CATEGORY_LABELS[row.original.ageCategory] },
  { id: 'joinedAt', header: 'Membre depuis', meta: { label: 'Membre depuis', sortKey: 'joinedAt' }, cell: ({ row }) => formatDate(row.original.joinedAt, 'short') },
  {
    id: 'status',
    header: 'Statut',
    meta: { label: 'Statut' },
    cell: ({ row }) => (row.original.active ? <StatusBadge tone="success">Actif</StatusBadge> : <StatusBadge tone="neutral">Désactivé</StatusBadge>),
  },
];

export function MembersTable({ data, sort, order }: { data: Paginated<Member>; sort?: string; order?: 'asc' | 'desc' }) {
  return (
    <DataTable
      caption="Membres"
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
          <DataTableSearch placeholder="Nom, courriel ou numéro" />
          <DataTableFilter param="status" label="Statut" options={[{ value: 'active', label: 'Actifs' }, { value: 'inactive', label: 'Désactivés' }]} />
          <DataTableFilter param="ageCategory" label="Âge" allLabel="Toutes" options={AGE_CATEGORIES.map((c) => ({ value: c, label: AGE_CATEGORY_LABELS[c] }))} />
        </>
      }
      empty={{ title: 'Aucun membre trouvé', description: 'Modifiez la recherche ou les filtres.' }}
    />
  );
}
