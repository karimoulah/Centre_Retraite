'use client';

import { DataTable, DataTableFilter, DataTableSearch, type DataTableColumn } from '@/components/backoffice/data-table';
import { PeriodPicker } from '@/components/backoffice/PeriodPicker';
import type { AuditEntry, Paginated } from '@/lib/api/contracts';
import { formatDateTime } from '@/lib/format';

import { ACTION_LABELS, ENTITY_LABELS } from '../labels';
import { AuditChanges } from './AuditChanges';

const columns: DataTableColumn<AuditEntry>[] = [
  { id: 'at', header: 'Date', meta: { label: 'Date', sortKey: 'at' }, enableHiding: false, cell: ({ row }) => <time dateTime={row.original.at} className="whitespace-nowrap">{formatDateTime(row.original.at)}</time> },
  { id: 'actor', header: 'Par', meta: { label: 'Par' }, cell: ({ row }) => row.original.actor?.name ?? <span className="text-text-muted">Visiteur du site</span> },
  { id: 'action', header: 'Action', meta: { label: 'Action' }, cell: ({ row }) => ACTION_LABELS[row.original.action] ?? row.original.action },
  {
    id: 'entity',
    header: 'Élément',
    meta: { label: 'Élément' },
    cell: ({ row }) => (
      <span>
        <span className="block">{row.original.entityLabel}</span>
        <span className="block text-sm text-text-muted">{ENTITY_LABELS[row.original.entityType] ?? row.original.entityType}</span>
      </span>
    ),
  },
  { id: 'changes', header: 'Avant / après', meta: { label: 'Avant / après' }, cell: ({ row }) => <AuditChanges entry={row.original} /> },
];

type Props = { data: Paginated<AuditEntry>; sort?: string; order?: 'asc' | 'desc'; actors: { value: string; label: string }[] };

export function AuditTable({ data, sort, order, actors }: Props) {
  return (
    <DataTable
      caption="Journal d’audit"
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
          <DataTableSearch placeholder="Élément ou action" />
          <DataTableFilter param="entityType" label="Type d’élément" options={Object.entries(ENTITY_LABELS).map(([value, label]) => ({ value, label }))} />
          <DataTableFilter param="actorId" label="Utilisateur" options={actors} />
          <PeriodPicker defaultPreset="all" />
        </>
      }
      empty={{ title: 'Aucune entrée', description: 'Aucune action ne correspond à ces filtres.' }}
    />
  );
}
