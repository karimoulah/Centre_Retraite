'use client';

import { CheckCheck, Trash2, Undo2 } from 'lucide-react';

import { ConfirmDialog } from '@/components/backoffice/ConfirmDialog';
import { Button } from '@/components/ui/button';
import type { EntryDetail } from '@/lib/api/contracts';
import { formatMoney } from '@/lib/format';

import { deleteDraftAction, reverseEntryAction, validateEntryAction } from '../actions';

/** Validate (final), delete a draft, reverse a validated entry (F5-07, F5-08). */
export function EntryActions({ entry }: { entry: EntryDetail }) {
  const canValidate = entry.status === 'DRAFT' || entry.status === 'APPROVED';
  const canReverse = entry.status === 'VALIDATED' && !entry.reverses && !entry.reversedBy;
  const missingReceipt = entry.direction === 'EXPENSE' && !entry.attachment;
  if (!canValidate && !canReverse && entry.status !== 'DRAFT') return null;
  return (
    <div className="flex flex-wrap gap-3">
      {canValidate && (
        <ConfirmDialog
          trigger={
            <Button
              variant="dark"
              disabled={missingReceipt}
              aria-describedby={missingReceipt ? 'missing-receipt' : undefined}
            >
              <CheckCheck aria-hidden />
              Valider l’écriture
            </Button>
          }
          title={`Valider ${entry.reference} ?`}
          consequence={
            <>
              Une fois validée, l’écriture{' '}
              <strong>ne pourra plus être modifiée ni supprimée</strong> et comptera dans les
              rapports. Une erreur se corrigera alors par une contrepassation.
            </>
          }
          confirmLabel="Valider définitivement"
          onConfirm={() => validateEntryAction(entry.id)}
        />
      )}
      {entry.status === 'DRAFT' && (
        <ConfirmDialog
          trigger={
            <Button variant="outline">
              <Trash2 aria-hidden />
              Supprimer le brouillon
            </Button>
          }
          title={`Supprimer le brouillon ${entry.reference} ?`}
          consequence="Le brouillon disparaît de la liste. La suppression est inscrite au journal."
          confirmLabel="Supprimer"
          tone="destructive"
          onConfirm={() => deleteDraftAction(entry.id)}
        />
      )}
      {canReverse && (
        <ConfirmDialog
          trigger={
            <Button variant="outline">
              <Undo2 aria-hidden />
              Contrepasser
            </Button>
          }
          title={`Contrepasser ${entry.reference} ?`}
          consequence={
            <>
              Une nouvelle écriture validée de{' '}
              <strong className="tabular-nums">{formatMoney(-entry.amountCents)}</strong> annulera
              exactement celle-ci : le solde net revient à zéro. L’écriture d’origine reste visible,
              et une écriture ne se contrepasse qu’une fois.
            </>
          }
          confirmLabel="Créer la contrepassation"
          tone="destructive"
          reason={{ label: 'Motif de la contrepassation', minLength: 5 }}
          onConfirm={(reason) => reverseEntryAction(entry.id, reason)}
        />
      )}
      {missingReceipt && canValidate && (
        <p id="missing-receipt" className="w-full text-sm text-text-muted">
          Joignez la facture ou le reçu pour pouvoir valider cette dépense.
        </p>
      )}
    </div>
  );
}
