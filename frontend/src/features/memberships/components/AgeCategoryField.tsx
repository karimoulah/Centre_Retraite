'use client';

import { useId } from 'react';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AGE_CATEGORIES, AGE_CATEGORY_LABELS, type AgeCategory } from '@/lib/api/contracts';

/** Large radio cards for the age category. */
export function AgeCategoryField({ value, onChange, error }: { value?: AgeCategory; onChange: (v: AgeCategory) => void; error?: string }) {
  const id = useId();
  return (
    <fieldset aria-describedby={error ? `${id}-error` : `${id}-help`}>
      <legend className="text-base font-medium">
        Catégorie d’âge <span className="text-status-error" aria-hidden>*</span>
      </legend>
      <p id={`${id}-help`} className="mt-1 mb-3 text-sm text-text-muted">
        Elle nous aide à proposer des activités adaptées.
      </p>
      <RadioGroup value={value} onValueChange={(v) => onChange(v as AgeCategory)} className="grid gap-2 sm:grid-cols-2" aria-invalid={!!error}>
        {AGE_CATEGORIES.map((category) => (
          <label key={category} htmlFor={`${id}-${category}`} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border px-4 has-[[data-state=checked]]:border-brand-900 has-[[data-state=checked]]:bg-accent-200">
            <RadioGroupItem id={`${id}-${category}`} value={category} className="size-5" />
            {AGE_CATEGORY_LABELS[category]}
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
