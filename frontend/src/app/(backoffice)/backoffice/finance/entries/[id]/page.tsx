import type { Metadata } from 'next';
import Link from 'next/link';

import { DetailList } from '@/components/backoffice/DetailList';
import { MoneyCell } from '@/components/backoffice/MoneyCell';
import { PageHeader } from '@/components/backoffice/PageHeader';
import { FormAlert } from '@/components/form';
import { EntryActions } from '@/features/finance/components/EntryActions';
import { EntryAttachment } from '@/features/finance/components/EntryAttachment';
import { EntryForm } from '@/features/finance/components/EntryForm';
import { EntryStatusBadge } from '@/features/finance/components/EntryStatusBadge';
import { getCategories, getEntry } from '@/features/finance/queries';
import { DIRECTION_LABELS, ENTRY_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/lib/api/contracts';
import { formatDate, formatDateTime } from '@/lib/format';
import { requireRole } from '@/lib/session';

export const metadata: Metadata = { title: 'Écriture' };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ reversed?: string }> };

const ACTIONS: Record<string, string> = {
  ENTRY_CREATED: 'Saisie',
  ENTRY_UPDATED: 'Modification du brouillon',
  ENTRY_VALIDATED: 'Validation',
  ENTRY_REVERSED: 'Contrepassation',
  EXPENSE_SUBMITTED: 'Envoi en approbation',
  EXPENSE_APPROVED: 'Approbation',
  EXPENSE_REJECTED: 'Refus',
  ATTACHMENT_ADDED: 'Pièce jointe',
  ATTACHMENT_REMOVED: 'Pièce retirée',
};

export default async function EntryPage({ params, searchParams }: Props) {
  await requireRole('FINANCE');
  const [{ id }, { reversed }] = await Promise.all([params, searchParams]);
  const entry = await getEntry(id);
  const categories =
    entry.status === 'DRAFT'
      ? await getCategories({ direction: entry.direction, active: 'true' })
      : [];
  const income = entry.direction === 'INCOME';

  return (
    <>
      <PageHeader
        title={`${DIRECTION_LABELS[entry.direction]} ${entry.reference}`}
        description={entry.description}
        actions={<EntryStatusBadge status={entry.status} />}
      />
      {reversed && (
        <FormAlert tone="success" title="Contrepassation créée">
          Cette écriture annule {entry.reverses?.reference}. Les deux écritures restent dans les
          livres.
        </FormAlert>
      )}
      {entry.status === 'SUBMITTED' && (
        <FormAlert tone="info" title="En attente d’approbation">
          Cette dépense dépasse le seuil : une autre personne que{' '}
          {entry.createdBy?.name ?? 'son auteur'} doit l’approuver dans{' '}
          <Link href="/backoffice/finance/expenses" className="underline underline-offset-4">
            les dépenses à approuver
          </Link>
          .
        </FormAlert>
      )}
      <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-8">
          <section aria-labelledby="entry-details" className="rounded-2xl border border-border p-6">
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
              <h2 id="entry-details" className="text-xl">
                Détail
              </h2>
              <MoneyCell cents={entry.amountCents} className="text-3xl font-semibold" />
            </div>
            <DetailList
              items={[
                { label: 'Date', value: formatDate(entry.entryDate + 'T12:00:00') },
                { label: 'Statut', value: ENTRY_STATUS_LABELS[entry.status] },
                { label: 'Catégorie', value: entry.category.name },
                { label: 'Mode de paiement', value: PAYMENT_METHOD_LABELS[entry.paymentMethod] },
                income
                  ? {
                      label: 'Contributeur',
                      value: entry.contributor && (
                        <Link
                          href={`/backoffice/finance/contributors/${entry.contributor.id}`}
                          className="underline underline-offset-4"
                        >
                          {entry.contributor.name}
                        </Link>
                      ),
                    }
                  : { label: 'Fournisseur', value: entry.supplier },
                { label: 'Projet ou activité', value: entry.project },
                {
                  label: 'Saisie',
                  value: `${entry.createdBy?.name ?? 'Système (don en ligne)'}, ${formatDateTime(entry.createdAt)}`,
                },
                ...(entry.decidedBy
                  ? [
                      {
                        label: entry.status === 'REJECTED' ? 'Refusée par' : 'Approuvée par',
                        value: `${entry.decidedBy.name}, ${formatDateTime(entry.decidedAt!)}`,
                      },
                    ]
                  : []),
                ...(entry.rejectionReason
                  ? [{ label: 'Motif du refus', value: entry.rejectionReason }]
                  : []),
                ...(entry.validatedAt
                  ? [
                      {
                        label: 'Validée',
                        value: `${entry.validatedBy?.name ?? 'Système (don en ligne)'}, ${formatDateTime(entry.validatedAt)}`,
                      },
                    ]
                  : []),
                ...(entry.reverses
                  ? [
                      {
                        label: 'Contrepasse',
                        value: (
                          <Link
                            href={`/backoffice/finance/entries/${entry.reverses.id}`}
                            className="underline underline-offset-4"
                          >
                            {entry.reverses.reference}
                          </Link>
                        ),
                      },
                      { label: 'Motif', value: entry.reversalReason },
                    ]
                  : []),
                ...(entry.reversedBy
                  ? [
                      {
                        label: 'Contrepassée par',
                        value: (
                          <Link
                            href={`/backoffice/finance/entries/${entry.reversedBy.id}`}
                            className="underline underline-offset-4"
                          >
                            {entry.reversedBy.reference}
                          </Link>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
            <div className="mt-8">
              <EntryActions entry={entry} />
            </div>
          </section>

          {entry.status === 'DRAFT' && (
            <section aria-labelledby="entry-edit" className="rounded-2xl border border-border p-6">
              <h2 id="entry-edit" className="mb-6 text-xl">
                Modifier le brouillon
              </h2>
              <EntryForm direction={entry.direction} categories={categories} entry={entry} />
            </section>
          )}
        </div>

        <div className="flex flex-col gap-8">
          <section
            aria-labelledby="entry-attachment"
            className="rounded-2xl border border-border p-6"
          >
            <h2 id="entry-attachment" className="mb-4 text-xl">
              Pièce justificative
            </h2>
            <EntryAttachment entry={entry} />
          </section>
          <section aria-labelledby="entry-history" className="rounded-2xl border border-border p-6">
            <h2 id="entry-history" className="mb-4 text-xl">
              Historique
            </h2>
            {entry.history.length ? (
              <ol className="flex flex-col gap-3">
                {entry.history.map((h, i) => (
                  <li key={i}>
                    <span className="font-medium">{ACTIONS[h.action] ?? h.action}</span>
                    <span className="block text-sm text-text-muted">
                      {h.actor?.name ?? 'Système'} · {formatDateTime(h.at)}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-text-muted">Aucun événement enregistré.</p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
