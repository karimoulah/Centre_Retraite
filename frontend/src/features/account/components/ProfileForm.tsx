'use client';

import { FormErrorAlert, FormField, SubmitButton, useActionForm } from '@/components/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { myProfileSchema, type MyProfileValues } from '@/features/memberships/schemas';
import type { Member } from '@/lib/api/contracts';

import { updateMyProfileAction } from '../actions';

export function ProfileForm({ member }: { member: Member }) {
  const { form, onSubmit, formError } = useActionForm<MyProfileValues>({
    schema: myProfileSchema,
    action: updateMyProfileAction,
    defaultValues: { phone: member.phone ?? '', address: member.address ?? '' },
  });
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6" aria-labelledby="coordonnees-modifiables">
      <h2 id="coordonnees-modifiables" className="text-2xl">
        Mes coordonnées
      </h2>
      <FormErrorAlert result={formError} />
      <FormField control={form.control} name="phone" label="Téléphone">
        {(props) => <Input {...props} value={String(props.value)} type="tel" autoComplete="tel" className="sm:w-80" />}
      </FormField>
      <FormField control={form.control} name="address" label="Adresse postale">
        {(props) => <Textarea {...props} value={String(props.value)} rows={3} autoComplete="street-address" className="min-h-24" />}
      </FormField>
      <div>
        <SubmitButton pending={form.formState.isSubmitting} size="lg">
          Enregistrer
        </SubmitButton>
      </div>
    </form>
  );
}
