'use client';

import Link from 'next/link';

import { DataTable, DataTableFilter, DataTableSearch, type DataTableColumn } from '@/components/backoffice/data-table';
import { ROLE_LABELS, ROLES, type Paginated, type UserAccount } from '@/lib/api/contracts';
import { formatDateTime } from '@/lib/format';

import { UserStatusBadge } from './UserStatusBadge';

const columns: DataTableColumn<UserAccount>[] = [
  {
    id: 'name',
    header: 'Nom',
    meta: { label: 'Nom', sortKey: 'name' },
    enableHiding: false,
    cell: ({ row }) => (
      <Link href={`/backoffice/users/${row.original.id}`} className="font-medium underline-offset-4 hover:underline">
        {row.original.firstName} {row.original.lastName}
      </Link>
    ),
  },
  { id: 'email', header: 'Courriel', meta: { label: 'Courriel', sortKey: 'email' }, cell: ({ row }) => row.original.email },
  {
    id: 'roles',
    header: 'Rôles',
    meta: { label: 'Rôles' },
    cell: ({ row }) => row.original.roles.map((role) => ROLE_LABELS[role]).join(', '),
  },
  { id: 'status', header: 'Statut', meta: { label: 'Statut' }, cell: ({ row }) => <UserStatusBadge user={row.original} /> },
  {
    id: 'lastLoginAt',
    header: 'Dernière connexion',
    meta: { label: 'Dernière connexion', sortKey: 'lastLoginAt' },
    cell: ({ row }) => (row.original.lastLoginAt ? formatDateTime(row.original.lastLoginAt) : <span className="text-text-muted">Jamais</span>),
  },
];

type Props = { data: Paginated<UserAccount>; sort?: string; order?: 'asc' | 'desc' };

export function UsersTable({ data, sort, order }: Props) {
  return (
    <DataTable
      caption="Utilisateurs"
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
          <DataTableSearch label="Rechercher" placeholder="Nom ou courriel" />
          <DataTableFilter param="role" label="Rôle" options={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))} />
          <DataTableFilter
            param="status"
            label="Statut"
            options={[
              { value: 'active', label: 'Actifs' },
              { value: 'invited', label: 'Invitation envoyée' },
              { value: 'inactive', label: 'Désactivés' },
            ]}
          />
        </>
      }
      empty={{ title: 'Aucun utilisateur', description: 'Aucun compte ne correspond à la recherche.' }}
    />
  );
}
