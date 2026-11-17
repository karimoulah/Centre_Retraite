'use client';

import Link from 'next/link';

import { FormErrorAlert, FormField, SubmitButton, useActionForm } from '@/components/form';
import { Input } from '@/components/ui/input';

import { loginAction } from '../actions';
import { loginSchema, type LoginValues } from '../schemas';

export function LoginForm({ next }: { next?: string }) {
  const { form, onSubmit, formError } = useActionForm<LoginValues>({
    schema: loginSchema,
    action: (values) => loginAction(values, next),
    defaultValues: { email: '', password: '' },
    successToast: false,
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FormErrorAlert result={formError} />
      <FormField control={form.control} name="email" label="Adresse courriel" required>
        {(props) => <Input {...props} value={String(props.value)} type="email" autoComplete="email" inputMode="email" />}
      </FormField>
      <FormField control={form.control} name="password" label="Mot de passe" required>
        {(props) => <Input {...props} value={String(props.value)} type="password" autoComplete="current-password" />}
      </FormField>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SubmitButton pending={form.formState.isSubmitting} pendingLabel="Connexion…" size="lg">
          Se connecter
        </SubmitButton>
        <Link href="/forgot-password" className="inline-flex min-h-11 items-center underline underline-offset-4 hover:no-underline">
          Mot de passe oublié ?
        </Link>
      </div>
    </form>
  );
}
