'use client';

import { useCallback, useState } from 'react';
import { Controller } from 'react-hook-form';
import { Lock } from 'lucide-react';

import {
  FormErrorAlert,
  FormField,
  SubmitButton,
  Turnstile,
  useActionForm,
} from '@/components/form';
import { Input } from '@/components/ui/input';
import { DONATION_PRESETS_CENTS, type DonationCheckout } from '@/lib/api/contracts';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

import { startDonationAction } from '../actions';
import { donationSchema, type DonationValues } from '../schemas';

const pill =
  'flex min-h-12 cursor-pointer items-center justify-center rounded-full border-2 px-6 text-lg font-semibold transition-colors';

/** Suggested amounts as pills, a free amount, the donor's name and e-mail, then the secure payment page. */
export function DonationForm() {
  const [token, setToken] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const onToken = useCallback((value: string | null) => setToken(value), []);
  const { form, onSubmit, formError } = useActionForm<DonationValues, DonationCheckout>({
    schema: donationSchema,
    defaultValues: {
      preset: String(DONATION_PRESETS_CENTS[1]),
      otherAmount: '',
      donorName: '',
      donorEmail: '',
    },
    action: (values) => startDonationAction(values, token),
    successToast: false,
    onSuccess: (data) => {
      if (!data) return;
      setLeaving(true);
      window.location.assign(data.url);
    },
  });
  const preset = form.watch('preset');

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8" aria-label="Faire un don">
      <FormErrorAlert result={formError} />
      <Controller
        control={form.control}
        name="preset"
        render={({ field }) => (
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-4 text-2xl font-medium">Montant de votre don</legend>
            <div
              role="radiogroup"
              aria-label="Montant de votre don"
              className="flex flex-wrap gap-3"
            >
              {[
                ...DONATION_PRESETS_CENTS.map((c) => ({
                  value: String(c),
                  label: formatMoney(c).replace(',00', ''),
                })),
                { value: 'other', label: 'Autre montant' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    pill,
                    field.value === option.value
                      ? 'border-brand-900 bg-brand-900 text-white'
                      : 'border-border bg-white text-text hover:border-brand-900',
                    'has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-900/40',
                  )}
                >
                  <input
                    type="radio"
                    name="preset"
                    value={option.value}
                    checked={field.value === option.value}
                    onChange={() => field.onChange(option.value)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
        )}
      />
      {preset === 'other' && (
        <FormField
          control={form.control}
          name="otherAmount"
          label="Autre montant ($)"
          required
          description="5 $ minimum."
        >
          {(props) => (
            <Input
              {...props}
              value={String(props.value)}
              inputMode="decimal"
              autoComplete="off"
              className="w-48 text-right text-lg tabular-nums"
            />
          )}
        </FormField>
      )}
      <fieldset className="flex flex-col gap-6">
        <legend className="mb-4 text-2xl font-medium">Vos coordonnées</legend>
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField control={form.control} name="donorName" label="Nom" required>
            {(props) => <Input {...props} value={String(props.value)} autoComplete="name" />}
          </FormField>
          <FormField
            control={form.control}
            name="donorEmail"
            label="Adresse courriel"
            required
            description="La confirmation de votre don y sera envoyée."
          >
            {(props) => (
              <Input {...props} value={String(props.value)} type="email" autoComplete="email" />
            )}
          </FormField>
        </div>
      </fieldset>
      <Turnstile onToken={onToken} />
      <div className="flex flex-col gap-3">
        <SubmitButton
          pending={form.formState.isSubmitting || leaving}
          pendingLabel="Ouverture du paiement sécurisé…"
          className="h-14 w-fit px-8 text-lg"
        >
          <Lock aria-hidden />
          Continuer vers le paiement sécurisé
        </SubmitButton>
        <p className="text-sm text-text-muted">
          Vous saisirez votre carte sur la page sécurisée de notre prestataire de paiement (Stripe).
          Le Centre ne voit ni ne conserve jamais vos données de carte.
        </p>
      </div>
    </form>
  );
}
