import Link from 'next/link';

import { MoneyCell } from '@/components/backoffice/MoneyCell';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { EntriesPage } from '@/lib/api/contracts';
import { formatDate } from '@/lib/format';

import { EntryStatusBadge } from './EntryStatusBadge';

/** Gifts and other income of one contributor (F5-02). */
export function ContributorEntries({ data }: { data: EntriesPage }) {
  if (!data.items.length)
    return <p className="text-text-muted">Aucun don ni aucune recette pour ce contributeur.</p>;
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Référence</TableHead>
            <TableHead>Catégorie</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Montant</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.items.map((e) => (
            <TableRow key={e.id}>
              <TableCell>{formatDate(e.entryDate + 'T12:00:00', 'short')}</TableCell>
              <TableCell>
                <Link
                  href={`/backoffice/finance/entries/${e.id}`}
                  className="underline-offset-4 hover:underline"
                >
                  {e.reference}
                </Link>
              </TableCell>
              <TableCell>{e.category.name}</TableCell>
              <TableCell>
                <EntryStatusBadge status={e.status} />
              </TableCell>
              <TableCell>
                <MoneyCell cents={e.amountCents} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4} className="font-medium">
              Total ({data.totals.count} écriture{data.totals.count > 1 ? 's' : ''})
            </TableCell>
            <TableCell>
              <MoneyCell cents={data.totals.incomeCents} className="font-semibold" />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
