'use client';

import { useState } from 'react';
import Link from 'next/link';

import { FormAlert, FormErrorAlert, FormField, SubmitButton, useActionForm } from '@/components/form';
import { Input } from '@/components/ui/input';

import { forgotPasswordAction } from '../actions';
import { forgotPasswordSchema, type ForgotPasswordValues } from '../schemas';

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { form, onSubmit, formError } = useActionForm<ForgotPasswordValues>({
    schema: forgotPasswordSchema,
    action: forgotPasswordAction,
    defaultValues: { email: '' },
    successToast: false,
    onSuccess: () => setSentTo(form.getValues('email')),
  });

  if (sentTo) {
    return (
      <FormAlert tone="success" title="Vérifiez votre boîte de réception">
        Si un compte existe pour <strong>{sentTo}</strong>, vous recevrez un courriel avec un lien pour choisir un
        nouveau mot de passe. Le lien est valide 1 heure. Pensez à regarder dans les courriels indésirables.
      </FormAlert>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FormErrorAlert result={formError} />
      <FormField control={form.control} name="email" label="Adresse courriel" required>
        {(props) => <Input {...props} value={String(props.value)} type="email" autoComplete="email" />}
      </FormField>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SubmitButton pending={form.formState.isSubmitting} size="lg">
          Recevoir le lien
        </SubmitButton>
        <Link href="/login" className="inline-flex min-h-11 items-center underline underline-offset-4 hover:no-underline">
          Retour à la connexion
        </Link>
      </div>
    </form>
  );
}
