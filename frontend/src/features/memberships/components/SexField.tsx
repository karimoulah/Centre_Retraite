'use client';

import { useId } from 'react';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SEX_LABELS, SEXES, type Sex } from '@/lib/api/contracts';

/** Two large radio cards: Masculin, Féminin. */
export function SexField({
  value,
  onChange,
  error,
}: {
  value?: Sex | null;
  onChange: (v: Sex) => void;
  error?: string;
}) {
  const id = useId();
  return (
    <fieldset aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="mb-3 text-base font-medium">
        Sexe{' '}
        <span className="text-status-error" aria-hidden>
          *
        </span>
      </legend>
      <RadioGroup
        value={value ?? undefined}
        onValueChange={(v) => onChange(v as Sex)}
        className="grid gap-2 sm:grid-cols-2"
        aria-invalid={!!error}
      >
        {SEXES.map((sex) => (
          <label
            key={sex}
            htmlFor={`${id}-${sex}`}
            className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border px-4 has-[[data-state=checked]]:border-brand-900 has-[[data-state=checked]]:bg-accent-200"
          >
            <RadioGroupItem id={`${id}-${sex}`} value={sex} className="size-5" />
            {SEX_LABELS[sex]}
          </label>
        ))}
      </RadioGroup>
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm font-medium text-status-error">
          {error}
        </p>
      )}
    </fieldset>
  );
}
