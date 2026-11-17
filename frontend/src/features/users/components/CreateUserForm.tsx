'use client';

import { useRouter } from 'next/navigation';
import { Controller } from 'react-hook-form';

import { FormErrorAlert, FormField, SubmitButton, useActionForm } from '@/components/form';
import { RoleCheckboxes } from '@/components/form/RoleCheckboxes';
import { Input } from '@/components/ui/input';

import { createUserAction } from '../actions';
import { createUserSchema, type CreateUserValues } from '../schemas';

export function CreateUserForm() {
  const router = useRouter();
  const { form, onSubmit, formError } = useActionForm<CreateUserValues, { id: string }>({
    schema: createUserSchema,
    action: createUserAction,
    defaultValues: { firstName: '', lastName: '', email: '', roles: [] },
    onSuccess: (data) => router.push(data ? `/backoffice/users/${data.id}` : '/backoffice/users'),
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-2xl flex-col gap-6">
      <FormErrorAlert result={formError} />
      <div className="grid gap-6 sm:grid-cols-2">
        <FormField control={form.control} name="firstName" label="Prénom" required>
          {(props) => <Input {...props} value={String(props.value)} autoComplete="off" />}
        </FormField>
        <FormField control={form.control} name="lastName" label="Nom" required>
          {(props) => <Input {...props} value={String(props.value)} autoComplete="off" />}
        </FormField>
      </div>
      <FormField control={form.control} name="email" label="Adresse courriel" required description="Une invitation y sera envoyée pour choisir un mot de passe.">
        {(props) => <Input {...props} value={String(props.value)} type="email" autoComplete="off" />}
      </FormField>
      <Controller
        control={form.control}
        name="roles"
        render={({ field, fieldState }) => (
          <RoleCheckboxes value={field.value} onChange={field.onChange} error={fieldState.error?.message} />
        )}
      />
      <div>
        <SubmitButton pending={form.formState.isSubmitting} pendingLabel="Envoi de l’invitation…">
          Créer et envoyer l’invitation
        </SubmitButton>
      </div>
    </form>
  );
}
