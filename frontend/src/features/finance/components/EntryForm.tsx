'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { FormErrorAlert, FormField, SubmitButton, useActionForm } from '@/components/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  MANUAL_PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type Category,
  type Entry,
  type EntryDirection,
} from '@/lib/api/contracts';
import { formatMoney } from '@/lib/format';

import { createEntryAction, updateEntryAction } from '../actions';
import {
  centsToInput,
  entrySchema,
  expenseSchema,
  todayInToronto,
  type EntryValues,
} from '../schemas';
import { checkFile, uploadAttachment } from '../upload';
import { AttachmentField } from './AttachmentField';
import { ContributorPicker } from './ContributorPicker';

type Props = {
  direction: EntryDirection;
  /** Active categories of this direction only. */
  categories: Category[];
  /** Expenses: threshold above which another person must approve. */
  thresholdCents?: number;
  /** Editing a draft. */
  entry?: Entry;
};

/** Income (F5-04) or expense (F5-05): dollars typed, cents sent; the receipt goes straight to storage. */
export function EntryForm({ direction, categories, thresholdCents, entry }: Props) {
  const router = useRouter();
  const income = direction === 'INCOME';
  const [contributor, setContributor] = useState<{ id: string; name: string } | null>(
    entry?.contributor ?? null,
  );
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const { form, onSubmit, formError } = useActionForm<EntryValues, Entry>({
    schema: income ? entrySchema : expenseSchema,
    defaultValues: {
      amount: entry ? centsToInput(entry.amountCents) : '',
      entryDate: entry?.entryDate ?? todayInToronto(),
      categoryId: entry?.category.id ?? '',
      paymentMethod: (entry?.paymentMethod as EntryValues['paymentMethod']) ?? undefined,
      description: entry?.description ?? '',
      project: entry?.project ?? '',
      supplier: entry?.supplier ?? '',
      contributorId: entry?.contributor?.id ?? '',
    },
    action: (values) => {
      const body = { ...values, contributorId: contributor?.id ?? '' };
      return entry
        ? updateEntryAction(entry.id, direction, body)
        : createEntryAction(direction, body);
    },
    successToast: false,
    onSuccess: async (saved) => {
      if (!saved) return;
      if (file) {
        const uploaded = await uploadAttachment(saved.id, file, setProgress);
        if (!uploaded.ok)
          toast.error(
            `Écriture enregistrée, mais ${uploaded.message.charAt(0).toLowerCase()}${uploaded.message.slice(1)} Ajoutez la pièce depuis la fiche.`,
          );
      }
      toast.success(
        saved.status === 'SUBMITTED'
          ? 'Dépense enregistrée : elle attend l’approbation d’une autre personne.'
          : entry
            ? 'Brouillon enregistré.'
            : income
              ? 'Recette enregistrée comme brouillon.'
              : 'Dépense enregistrée comme brouillon.',
      );
      router.push(`/backoffice/finance/entries/${saved.id}`);
    },
  });

  const submitting = form.formState.isSubmitting || progress !== null;

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-6"
      aria-label={income ? 'Nouvelle recette' : 'Nouvelle dépense'}
    >
      <FormErrorAlert result={formError} />
      {!income && thresholdCents !== undefined && (
        <p className="rounded-xl bg-surface-muted p-4">
          Au-delà de <strong>{formatMoney(thresholdCents)}</strong>, la dépense devra être approuvée
          par une autre personne avant d’être validée.
        </p>
      )}
      <div className="grid gap-6 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="amount"
          label="Montant ($)"
          required
          description="En dollars, par exemple 125,50."
        >
          {(props) => (
            <Input
              {...props}
              value={String(props.value)}
              inputMode="decimal"
              autoComplete="off"
              className="text-right tabular-nums sm:w-48"
            />
          )}
        </FormField>
        <FormField control={form.control} name="entryDate" label="Date" required>
          {(props) => (
            <Input
              {...props}
              value={String(props.value)}
              type="date"
              max={todayInToronto()}
              className="sm:w-56"
            />
          )}
        </FormField>
        <FormField control={form.control} name="categoryId" label="Catégorie" required>
          {({ onChange, value, id, ...rest }) => (
            <Select value={String(value)} onValueChange={onChange}>
              <SelectTrigger
                id={id}
                aria-invalid={rest['aria-invalid']}
                aria-describedby={rest['aria-describedby']}
                className="w-full"
              >
                <SelectValue
                  placeholder={
                    income ? 'Choisir une catégorie de recette' : 'Choisir une catégorie de dépense'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
        <FormField control={form.control} name="paymentMethod" label="Mode de paiement" required>
          {({ onChange, value, id, ...rest }) => (
            <Select value={value ? String(value) : undefined} onValueChange={onChange}>
              <SelectTrigger
                id={id}
                aria-invalid={rest['aria-invalid']}
                aria-describedby={rest['aria-describedby']}
                className="w-full"
              >
                <SelectValue placeholder="Choisir" />
              </SelectTrigger>
              <SelectContent>
                {MANUAL_PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {PAYMENT_METHOD_LABELS[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
      </div>
      {income ? (
        <ContributorPicker value={contributor} onChange={setContributor} />
      ) : (
        <FormField control={form.control} name="supplier" label="Fournisseur" required>
          {(props) => <Input {...props} value={String(props.value)} autoComplete="off" />}
        </FormField>
      )}
      <FormField control={form.control} name="description" label="Description" required>
        {(props) => (
          <Textarea {...props} value={String(props.value)} rows={2} className="min-h-16" />
        )}
      </FormField>
      <FormField
        control={form.control}
        name="project"
        label="Projet ou activité"
        description="Pour regrouper les écritures d’une même activité, par exemple « Fête de Noël »."
      >
        {(props) => <Input {...props} value={String(props.value)} autoComplete="off" />}
      </FormField>
      {!entry && (
        <AttachmentField
          file={file}
          progress={progress}
          error={fileError}
          description={
            income
              ? 'Reçu ou bordereau : PDF, JPG ou PNG, 10 Mo au plus.'
              : 'Facture ou reçu : PDF, JPG ou PNG, 10 Mo au plus. Obligatoire pour valider une dépense.'
          }
          onChange={(f) => {
            setFile(f);
            setFileError(f ? checkFile(f) : null);
          }}
        />
      )}
      <div>
        <SubmitButton
          pending={submitting}
          disabled={!!fileError}
          pendingLabel={progress !== null ? 'Envoi de la pièce…' : 'Enregistrement…'}
        >
          {entry
            ? 'Enregistrer le brouillon'
            : income
              ? 'Enregistrer la recette'
              : 'Enregistrer la dépense'}
        </SubmitButton>
      </div>
    </form>
  );
}
