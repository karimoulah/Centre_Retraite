'use client';

import { useCallback, useState } from 'react';
import { Controller } from 'react-hook-form';

import { FormAlert, FormErrorAlert, FormField, SubmitButton, Turnstile, useActionForm } from '@/components/form';
import { CheckboxField } from '@/components/form/CheckboxField';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { applyForMembershipAction } from '../actions';
import { membershipSchema, type MembershipValues } from '../schemas';
import { AgeCategoryField } from './AgeCategoryField';
import { SexField } from './SexField';

export function MembershipForm() {
  const [token, setToken] = useState<string | null>(null);
  const onToken = useCallback((value: string | null) => setToken(value), []);
  const { form, onSubmit, formError } = useActionForm<MembershipValues>({
    schema: membershipSchema,
    action: (values) => applyForMembershipAction(values, token),
    defaultValues: { firstName: '', lastName: '', email: '', phone: '', address: '', birthDate: '', birthdayWishesConsent: false, newsletterConsent: false },
    successToast: false,
  });
  const birthDate = form.watch('birthDate');

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8" aria-label="Demande d’adhésion">
      <FormErrorAlert result={formError} />
      <fieldset className="flex flex-col gap-6">
        <legend className="mb-4 text-2xl font-medium">Vos coordonnées</legend>
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField control={form.control} name="firstName" label="Prénom" required>
            {(props) => <Input {...props} value={String(props.value)} autoComplete="given-name" />}
          </FormField>
          <FormField control={form.control} name="lastName" label="Nom" required>
            {(props) => <Input {...props} value={String(props.value)} autoComplete="family-name" />}
          </FormField>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField control={form.control} name="email" label="Adresse courriel" required>
            {(props) => <Input {...props} value={String(props.value)} type="email" autoComplete="email" />}
          </FormField>
          <FormField control={form.control} name="phone" label="Téléphone">
            {(props) => <Input {...props} value={String(props.value)} type="tel" autoComplete="tel" />}
          </FormField>
        </div>
        <Controller
          control={form.control}
          name="sex"
          render={({ field, fieldState }) => <SexField value={field.value} onChange={field.onChange} error={fieldState.error?.message} />}
        />
        <FormField control={form.control} name="address" label="Adresse postale">
          {(props) => <Textarea {...props} value={String(props.value)} rows={3} autoComplete="street-address" className="min-h-20" />}
        </FormField>
      </fieldset>

      <fieldset className="flex flex-col gap-6">
        <legend className="mb-4 text-2xl font-medium">Votre âge</legend>
        <Controller
          control={form.control}
          name="ageCategory"
          render={({ field, fieldState }) => <AgeCategoryField value={field.value} onChange={field.onChange} error={fieldState.error?.message} />}
        />
        <FormField
          control={form.control}
          name="birthDate"
          label="Date de naissance"
          description="Facultative : elle sert uniquement à vous souhaiter bon anniversaire si vous l’acceptez ci-dessous. Elle n’est jamais affichée publiquement."
        >
          {(props) => <Input {...props} value={String(props.value)} type="date" autoComplete="bday" className="w-full sm:w-64" />}
        </FormField>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-4 text-2xl font-medium">Vos préférences</legend>
        <Controller
          control={form.control}
          name="birthdayWishesConsent"
          render={({ field }) => (
            <CheckboxField
              checked={field.value}
              onChange={field.onChange}
              label="Je souhaite recevoir les vœux d’anniversaire du Centre"
              description={birthDate ? 'Par courriel, le jour de votre anniversaire.' : 'Indiquez votre date de naissance ci-dessus pour les recevoir.'}
            />
          )}
        />
        <Controller
          control={form.control}
          name="newsletterConsent"
          render={({ field }) => (
            <CheckboxField checked={field.value} onChange={field.onChange} label="Je souhaite recevoir les nouvelles et le calendrier des activités" description="Environ une fois par mois. Désinscription en un clic." />
          )}
        />
        <p className="text-[0.95rem] text-text-muted">Vous pourrez changer ces choix à tout moment dans votre espace membre.</p>
      </fieldset>

      <Turnstile onToken={onToken} />
      <FormAlert tone="info">
        Vos renseignements servent uniquement à gérer votre adhésion. Ils ne sont jamais vendus ni partagés.
      </FormAlert>
      <div>
        <SubmitButton pending={form.formState.isSubmitting} pendingLabel="Envoi de la demande…" size="lg" variant="accent">
          Envoyer ma demande d’adhésion
        </SubmitButton>
      </div>
    </form>
  );
}
