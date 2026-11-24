'use client';

import Link from 'next/link';

import {
  DataTable,
  DataTableFilter,
  DataTableSearch,
  type DataTableColumn,
} from '@/components/backoffice/data-table';
import {
  CONTRIBUTOR_KIND_LABELS,
  CONTRIBUTOR_KINDS,
  type Contributor,
  type Paginated,
} from '@/lib/api/contracts';

const columns: DataTableColumn<Contributor>[] = [
  {
    id: 'name',
    header: 'Nom',
    meta: { label: 'Nom', sortKey: 'name' },
    enableHiding: false,
    cell: ({ row }) => (
      <Link
        href={`/backoffice/finance/contributors/${row.original.id}`}
        className="font-medium underline-offset-4 hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    id: 'kind',
    header: 'Type',
    meta: { label: 'Type' },
    cell: ({ row }) => CONTRIBUTOR_KIND_LABELS[row.original.kind],
  },
  {
    id: 'email',
    header: 'Courriel',
    meta: { label: 'Courriel' },
    cell: ({ row }) => row.original.email ?? '—',
  },
  {
    id: 'phone',
    header: 'Téléphone',
    meta: { label: 'Téléphone' },
    cell: ({ row }) => row.original.phone ?? '—',
  },
  {
    id: 'member',
    header: 'Membre',
    meta: { label: 'Membre' },
    cell: ({ row }) => row.original.member?.memberNumber ?? '—',
  },
];

export function ContributorsTable({
  data,
  sort,
  order,
}: {
  data: Paginated<Contributor>;
  sort?: string;
  order?: 'asc' | 'desc';
}) {
  return (
    <DataTable
      caption="Contributeurs"
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
            param="kind"
            label="Type"
            allLabel="Tous"
            options={CONTRIBUTOR_KINDS.map((k) => ({
              value: k,
              label: CONTRIBUTOR_KIND_LABELS[k],
            }))}
          />
        </>
      }
      empty={{
        title: 'Aucun contributeur',
        description:
          'Les donateurs et organismes apparaissent ici dès leur premier don ou leur création.',
      }}
    />
  );
}
