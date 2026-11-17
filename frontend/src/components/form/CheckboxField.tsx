'use client';

import { useId } from 'react';

import { Checkbox } from '@/components/ui/checkbox';

/** Large checkbox with a label and an explanation, for consents. */
export function CheckboxField({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-border p-4 has-[:checked]:border-brand-900">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(!!v)} className="mt-0.5 size-5" aria-describedby={description ? `${id}-d` : undefined} />
      <span>
        <span className="block font-medium">{label}</span>
        {description && (
          <span id={`${id}-d`} className="block text-[0.95rem] text-text-muted">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
