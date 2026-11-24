'use client';

import { FormErrorAlert, FormField, SubmitButton, useActionForm } from '@/components/form';
import { Input } from '@/components/ui/input';
import type { FinanceSettings } from '@/lib/api/contracts';
import { formatDateTime } from '@/lib/format';

import { updateFinanceSettingsAction } from '../actions';
import { centsToInput, thresholdSchema, type ThresholdValues } from '../schemas';

/** Expense approval threshold (F5-10). */
export function ThresholdSetting({ settings }: { settings: FinanceSettings }) {
  const { form, onSubmit, formError } = useActionForm<ThresholdValues, FinanceSettings>({
    schema: thresholdSchema,
    defaultValues: { threshold: centsToInput(settings.expenseApprovalThresholdCents) },
    action: updateFinanceSettingsAction,
  });
  return (
    <section aria-labelledby="threshold-title" className="rounded-2xl border border-border p-6">
      <h2 id="threshold-title" className="text-xl">
        Seuil d’approbation des dépenses
      </h2>
      <p className="mt-2 max-w-2xl text-text-muted">
        Une dépense dont le montant dépasse ce seuil doit être approuvée par une autre personne que
        celle qui l’a saisie avant d’être validée.
      </p>
      {settings.updatedAt && (
        <p className="mt-3 text-sm text-text-muted">
          Dernière modification le {formatDateTime(settings.updatedAt)} par {settings.updatedBy}.
        </p>
      )}
      <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-wrap items-end gap-4">
        <div className="w-full empty:hidden">
          <FormErrorAlert result={formError} />
        </div>
        <FormField control={form.control} name="threshold" label="Seuil ($)" required>
          {(props) => (
            <Input
              {...props}
              value={String(props.value)}
              inputMode="decimal"
              className="w-48 text-right tabular-nums"
            />
          )}
        </FormField>
        <SubmitButton pending={form.formState.isSubmitting}>Enregistrer le seuil</SubmitButton>
      </form>
    </section>
  );
}
