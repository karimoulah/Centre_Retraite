'use client';

import { useRouter } from 'next/navigation';
import { Controller } from 'react-hook-form';

import { FormErrorAlert, FormField, SubmitButton, useActionForm } from '@/components/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CONTRIBUTOR_KIND_LABELS, CONTRIBUTOR_KINDS, type Contributor } from '@/lib/api/contracts';

import { createContributorAction, updateContributorAction } from '../actions';
import { contributorSchema, type ContributorValues } from '../schemas';

/** Create (no contributor) or edit. `onCreated` is used by the quick creation of the entry form. */
export function ContributorForm({
  contributor,
  onCreated,
  compact,
}: {
  contributor?: Contributor;
  onCreated?: (c: Contributor) => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const { form, onSubmit, formError } = useActionForm<ContributorValues, Contributor>({
    schema: contributorSchema,
    defaultValues: {
      kind: contributor?.kind ?? 'INDIVIDUAL',
      name: contributor?.name ?? '',
      email: contributor?.email ?? '',
      phone: contributor?.phone ?? '',
      address: contributor?.address ?? '',
      notes: contributor?.notes ?? '',
    },
    action: (values) =>
      contributor
        ? updateContributorAction(contributor.id, values)
        : createContributorAction(values),
    onSuccess: (saved) => {
      if (!saved) return;
      if (onCreated) onCreated(saved);
      else if (!contributor) router.push(`/backoffice/finance/contributors/${saved.id}`);
    },
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-6"
      aria-label={contributor ? 'Fiche du contributeur' : 'Nouveau contributeur'}
    >
      <FormErrorAlert result={formError} />
      <Controller
        control={form.control}
        name="kind"
        render={({ field }) => (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-base font-medium">Type</legend>
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="flex flex-wrap gap-4"
            >
              {CONTRIBUTOR_KINDS.map((k) => (
                <div key={k} className="flex items-center gap-2">
                  <RadioGroupItem value={k} id={`kind-${k}${compact ? '-q' : ''}`} />
                  <Label htmlFor={`kind-${k}${compact ? '-q' : ''}`} className="text-base">
                    {CONTRIBUTOR_KIND_LABELS[k]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </fieldset>
        )}
      />
      <div className={compact ? 'flex flex-col gap-6' : 'grid gap-6 sm:grid-cols-2'}>
        <FormField control={form.control} name="name" label="Nom" required>
          {(props) => <Input {...props} value={String(props.value)} autoComplete="off" />}
        </FormField>
        <FormField
          control={form.control}
          name="email"
          label="Adresse courriel"
          description={compact ? undefined : 'Sert à retrouver le donateur lors d’un don en ligne.'}
        >
          {(props) => <Input {...props} value={String(props.value)} type="email" />}
        </FormField>
        {!compact && (
          <FormField control={form.control} name="phone" label="Téléphone">
            {(props) => <Input {...props} value={String(props.value)} type="tel" />}
          </FormField>
        )}
      </div>
      {!compact && (
        <>
          <FormField control={form.control} name="address" label="Adresse postale">
            {(props) => (
              <Textarea {...props} value={String(props.value)} rows={3} className="min-h-20" />
            )}
          </FormField>
          <FormField control={form.control} name="notes" label="Notes internes">
            {(props) => (
              <Textarea {...props} value={String(props.value)} rows={3} className="min-h-20" />
            )}
          </FormField>
        </>
      )}
      <div>
        <SubmitButton pending={form.formState.isSubmitting}>
          {contributor ? 'Enregistrer la fiche' : 'Créer le contributeur'}
        </SubmitButton>
      </div>
    </form>
  );
}
