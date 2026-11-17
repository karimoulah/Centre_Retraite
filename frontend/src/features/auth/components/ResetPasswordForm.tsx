'use client';

import Link from 'next/link';
import { Check, X } from 'lucide-react';

import { FormAlert, FormField, SubmitButton, useActionForm } from '@/components/form';
import { FormErrorAlert } from '@/components/form/FormErrorAlert';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { resetPasswordAction } from '../actions';
import { resetPasswordSchema, type ResetPasswordValues } from '../schemas';

const rules = [
  { label: 'Au moins 12 caractères', test: (v: string) => v.length >= 12 },
  { label: 'Une lettre majuscule', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'Une lettre minuscule', test: (v: string) => /[a-z]/.test(v) },
  { label: 'Un chiffre', test: (v: string) => /[0-9]/.test(v) },
];

export function ResetPasswordForm({ token }: { token: string }) {
  const { form, onSubmit, formError } = useActionForm<ResetPasswordValues>({
    schema: resetPasswordSchema,
    action: (values) => resetPasswordAction(token, values),
    defaultValues: { password: '', confirmation: '' },
    successToast: false,
  });
  const password = form.watch('password') ?? '';

  if (formError && !formError.ok && formError.code === 'TOKEN_EXPIRED') {
    return (
      <FormAlert title="Lien expiré">
        {formError.message}{' '}
        <Link href="/forgot-password" className="font-medium underline">
          Demander un nouveau lien
        </Link>
      </FormAlert>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FormErrorAlert result={formError} />
      <FormField control={form.control} name="password" label="Nouveau mot de passe" required>
        {(props) => <Input {...props} value={String(props.value)} type="password" autoComplete="new-password" />}
      </FormField>
      <ul aria-label="Règles du mot de passe" className="grid gap-1.5 sm:grid-cols-2">
        {rules.map((rule) => {
          const met = rule.test(password);
          return (
            <li key={rule.label} className={cn('flex items-center gap-2 text-[0.95rem]', met ? 'text-status-success' : 'text-text-muted')}>
              {met ? <Check aria-hidden className="size-4" /> : <X aria-hidden className="size-4" />}
              {rule.label}
              <span className="sr-only">{met ? ' : respectée' : ' : à respecter'}</span>
            </li>
          );
        })}
      </ul>
      <FormField control={form.control} name="confirmation" label="Confirmer le mot de passe" required>
        {(props) => <Input {...props} value={String(props.value)} type="password" autoComplete="new-password" />}
      </FormField>
      <div>
        <SubmitButton pending={form.formState.isSubmitting} size="lg">
          Enregistrer le mot de passe
        </SubmitButton>
      </div>
    </form>
  );
}
