'use client';

import Link from 'next/link';
import { Check, X } from 'lucide-react';

import { ConfirmDialog } from '@/components/backoffice/ConfirmDialog';
import { EmptyState } from '@/components/backoffice/EmptyState';
import { MoneyCell } from '@/components/backoffice/MoneyCell';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Entry } from '@/lib/api/contracts';
import { formatDate, formatMoney } from '@/lib/format';

import { approveExpenseAction, rejectExpenseAction } from '../actions';

/**
 * Expenses above the threshold waiting for a second person (F5-09). The buttons stay visible but
 * disabled for their author, with the reason next to them; the API refuses anyway.
 */
export function ExpenseApprovalQueue({
  expenses,
  currentUserId,
}: {
  expenses: Entry[];
  currentUserId: string;
}) {
  if (!expenses.length) {
    return (
      <EmptyState
        title="Aucune dépense à approuver"
        description="Les dépenses au-delà du seuil apparaissent ici jusqu’à leur approbation ou leur refus."
      />
    );
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Dépense</TableHead>
            <TableHead>Saisie par</TableHead>
            <TableHead className="text-right">Montant</TableHead>
            <TableHead className="text-right">Décision</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((e) => {
            const own = e.createdBy?.id === currentUserId;
            return (
              <TableRow key={e.id}>
                <TableCell className="whitespace-nowrap">
                  {formatDate(e.entryDate + 'T12:00:00', 'short')}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/backoffice/finance/entries/${e.id}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {e.reference}
                  </Link>
                  <span className="block">{e.description}</span>
                  <span className="block text-sm text-text-muted">
                    {e.supplier} · {e.category.name}
                    {e.attachment ? ' · facture jointe' : ' · sans facture'}
                  </span>
                </TableCell>
                <TableCell>{e.createdBy?.name ?? '—'}</TableCell>
                <TableCell>
                  <MoneyCell cents={e.amountCents} className="font-semibold" />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex flex-wrap justify-end gap-2">
                      <ConfirmDialog
                        trigger={
                          <Button
                            variant="dark"
                            disabled={own}
                            aria-describedby={own ? `own-${e.id}` : undefined}
                          >
                            <Check aria-hidden />
                            Approuver
                          </Button>
                        }
                        title={`Approuver ${e.reference} (${formatMoney(e.amountCents)}) ?`}
                        consequence="La dépense pourra ensuite être validée. Votre approbation est inscrite au journal."
                        confirmLabel="Approuver"
                        onConfirm={() => approveExpenseAction(e.id)}
                      />
                      <ConfirmDialog
                        trigger={
                          <Button
                            variant="outline"
                            disabled={own}
                            aria-describedby={own ? `own-${e.id}` : undefined}
                          >
                            <X aria-hidden />
                            Refuser
                          </Button>
                        }
                        title={`Refuser ${e.reference} ?`}
                        consequence="La dépense ne pourra pas être validée. Le motif est conservé dans le journal."
                        confirmLabel="Refuser la dépense"
                        tone="destructive"
                        reason={{ label: 'Motif du refus', minLength: 5 }}
                        onConfirm={(reason) => rejectExpenseAction(e.id, reason)}
                      />
                    </div>
                    {own && (
                      <p id={`own-${e.id}`} className="max-w-56 text-right text-sm text-text-muted">
                        Vous avez saisi cette dépense : une autre personne doit l’approuver.
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
