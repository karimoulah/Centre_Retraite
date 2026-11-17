'use client';

import { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type VisibilityState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Columns3 } from 'lucide-react';

import { EmptyState } from '@/components/backoffice/EmptyState';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PAGE_SIZES } from '@/lib/list-params';
import { cn } from '@/lib/utils';

import { useUrlState } from './use-url-state';

export type DataTableColumn<T> = ColumnDef<T> & {
  meta?: { label?: string; align?: 'right'; sortKey?: string };
};

type DataTableProps<T> = {
  /** Accessible name of the table, e.g. "Liste des membres". */
  caption: string;
  columns: DataTableColumn<T>[];
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  sort?: string;
  order?: 'asc' | 'desc';
  getRowId?: (row: T) => string;
  toolbar?: React.ReactNode;
  empty?: { title: string; description?: string; action?: React.ReactNode };
};

/**
 * Generic list: pagination, sorting and filters are done by the server and stored in the URL,
 * so lists can be bookmarked and the back button works.
 */
export function DataTable<T>({
  caption,
  columns,
  data,
  total,
  page,
  pageSize,
  sort,
  order,
  getRowId,
  toolbar,
  empty,
}: DataTableProps<T>) {
  const { setParams, isPending } = useUrlState();
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    rowCount: total,
  });
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const firstRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(page * pageSize, total);

  function toggleSort(key: string) {
    const nextOrder = sort === key && order === 'asc' ? 'desc' : 'asc';
    setParams({ sort: key, order: nextOrder });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">{toolbar}</div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Columns3 aria-hidden />
              Colonnes
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Colonnes affichées</DropdownMenuLabel>
            {table
              .getAllLeafColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  onSelect={(event) => event.preventDefault()}
                >
                  {(column.columnDef as DataTableColumn<T>).meta?.label ?? column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {total === 0 ? (
        <EmptyState title={empty?.title ?? 'Aucun résultat'} description={empty?.description ?? 'Modifiez la recherche ou les filtres.'} action={empty?.action} />
      ) : (
        <div className={cn('overflow-x-auto rounded-2xl border border-border transition-opacity', isPending && 'opacity-60')} aria-busy={isPending}>
          <Table>
            <caption className="sr-only">
              {caption}, page {page} sur {pageCount}
            </caption>
            <TableHeader className="bg-surface-muted">
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id}>
                  {group.headers.map((header) => {
                    const meta = (header.column.columnDef as DataTableColumn<T>).meta;
                    const sortKey = meta?.sortKey;
                    const active = sortKey && sort === sortKey;
                    const label = header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext());
                    return (
                      <TableHead
                        key={header.id}
                        className={cn('h-12 px-4 text-[0.9rem] font-medium text-text', meta?.align === 'right' && 'text-right')}
                        aria-sort={active ? (order === 'desc' ? 'descending' : 'ascending') : undefined}
                      >
                        {sortKey ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(sortKey)}
                            className={cn('-mx-2 inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 hover:bg-border', meta?.align === 'right' && 'flex-row-reverse')}
                          >
                            {label}
                            {active ? (
                              order === 'desc' ? <ArrowDown aria-hidden className="size-4" /> : <ArrowUp aria-hidden className="size-4" />
                            ) : (
                              <ArrowUpDown aria-hidden className="size-4 text-text-muted" />
                            )}
                            <span className="sr-only">, trier</span>
                          </button>
                        ) : (
                          label
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => {
                    const meta = (cell.column.columnDef as DataTableColumn<T>).meta;
                    return (
                      <TableCell key={cell.id} className={cn('px-4 py-3 text-[0.95rem]', meta?.align === 'right' && 'text-right')}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-text-muted">
          {total === 0 ? 'Aucun élément' : `${firstRow} à ${lastRow} sur ${total}`}
        </p>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-text-muted">
            <span>Par page</span>
            <Select value={String(pageSize)} onValueChange={(value) => setParams({ pageSize: value })}>
              <SelectTrigger className="w-24" aria-label="Éléments par page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setParams({ page: page - 1 }, { keepPage: true })} aria-label="Page précédente">
            <ChevronLeft aria-hidden />
          </Button>
          <span className="tabular-nums">
            {page} / {pageCount}
          </span>
          <Button variant="outline" size="icon" disabled={page >= pageCount} onClick={() => setParams({ page: page + 1 }, { keepPage: true })} aria-label="Page suivante">
            <ChevronRight aria-hidden />
          </Button>
        </div>
      </nav>
    </div>
  );
}
