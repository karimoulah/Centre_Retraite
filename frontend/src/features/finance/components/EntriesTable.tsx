'use client';

import Link from 'next/link';

import { MoneyCell } from '@/components/backoffice/MoneyCell';
import { PeriodPicker } from '@/components/backoffice/PeriodPicker';
import {
  DataTable,
  DataTableFilter,
  DataTableSearch,
  type DataTableColumn,
} from '@/components/backoffice/data-table';
import {
  DIRECTION_LABELS,
  ENTRY_STATUS_LABELS,
  ENTRY_STATUSES,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  type Category,
  type EntriesPage,
  type Entry,
} from '@/lib/api/contracts';
import { formatDate } from '@/lib/format';

import { EntryStatusBadge } from './EntryStatusBadge';

const columns: DataTableColumn<Entry>[] = [
  {
    id: 'entryDate',
    header: 'Date',
    meta: { label: 'Date', sortKey: 'entryDate' },
    cell: ({ row }) => formatDate(row.original.entryDate + 'T12:00:00', 'short'),
  },
  {
    id: 'reference',
    header: 'Référence',
    meta: { label: 'Référence', sortKey: 'reference' },
    enableHiding: false,
    cell: ({ row }) => (
      <Link
        href={`/backoffice/finance/entries/${row.original.id}`}
        className="font-medium whitespace-nowrap underline-offset-4 hover:underline"
      >
        {row.original.reference}
      </Link>
    ),
  },
  {
    id: 'description',
    header: 'Description',
    meta: { label: 'Description' },
    cell: ({ row }) => (
      <span>
        {row.original.description}
        {(row.original.supplier || row.original.contributor) && (
          <span className="block text-sm text-text-muted">
            {row.original.supplier ?? row.original.contributor?.name}
          </span>
        )}
      </span>
    ),
  },
  {
    id: 'category',
    header: 'Catégorie',
    meta: { label: 'Catégorie' },
    cell: ({ row }) => row.original.category.name,
  },
  {
    id: 'direction',
    header: 'Sens',
    meta: { label: 'Sens' },
    cell: ({ row }) => DIRECTION_LABELS[row.original.direction],
  },
  {
    id: 'paymentMethod',
    header: 'Mode',
    meta: { label: 'Mode' },
    cell: ({ row }) => PAYMENT_METHOD_LABELS[row.original.paymentMethod],
  },
  {
    id: 'status',
    header: 'Statut',
    meta: { label: 'Statut', sortKey: 'status' },
    cell: ({ row }) => <EntryStatusBadge status={row.original.status} />,
  },
  {
    id: 'amount',
    header: 'Montant',
    meta: { label: 'Montant', align: 'right', sortKey: 'amount' },
    enableHiding: false,
    cell: ({ row }) => <MoneyCell cents={row.original.amountCents} />,
  },
];

export function EntriesTable({
  data,
  categories,
  sort,
  order,
}: {
  data: EntriesPage;
  categories: Category[];
  sort?: string;
  order?: 'asc' | 'desc';
}) {
  return (
    <DataTable
      caption="Écritures"
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
          <DataTableSearch placeholder="Référence, description, fournisseur" />
          <PeriodPicker defaultPreset="all" />
          <DataTableFilter
            param="direction"
            label="Sens"
            allLabel="Recettes et dépenses"
            options={(['INCOME', 'EXPENSE'] as const).map((d) => ({
              value: d,
              label: DIRECTION_LABELS[d],
            }))}
          />
          <DataTableFilter
            param="categoryId"
            label="Catégorie"
            allLabel="Toutes"
            options={categories.map((c) => ({
              value: c.id,
              label: `${c.name} (${DIRECTION_LABELS[c.direction].toLowerCase()})`,
            }))}
          />
          <DataTableFilter
            param="status"
            label="Statut"
            allLabel="Tous"
            options={ENTRY_STATUSES.map((s) => ({ value: s, label: ENTRY_STATUS_LABELS[s] }))}
          />
          <DataTableFilter
            param="paymentMethod"
            label="Mode de paiement"
            allLabel="Tous"
            options={PAYMENT_METHODS.map((m) => ({ value: m, label: PAYMENT_METHOD_LABELS[m] }))}
          />
        </>
      }
      empty={{
        title: 'Aucune écriture',
        description: 'Changez les filtres ou saisissez une recette ou une dépense.',
      }}
    />
  );
}
