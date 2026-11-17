'use client';

import { useId, type ReactElement, type ReactNode } from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type ControlProps = {
  id: string;
  name: string;
  value: unknown;
  onChange: (...event: unknown[]) => void;
  onBlur: () => void;
  ref: (element: unknown) => void;
  'aria-invalid': boolean;
  'aria-describedby'?: string;
  'aria-required'?: boolean;
  disabled?: boolean;
};

type FormFieldProps<TValues extends FieldValues> = {
  control: Control<TValues>;
  name: Path<TValues>;
  label: string;
  description?: ReactNode;
  required?: boolean;
  className?: string;
  /** Renders the input; receives every prop needed for a11y and react-hook-form. */
  children: (props: ControlProps) => ReactElement;
};

/** Label, input, help text and error under the field, wired for screen readers. */
export function FormField<TValues extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  className,
  children,
}: FormFieldProps<TValues>) {
  const id = useId();
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const describedBy = [description ? descriptionId : null, fieldState.error ? errorId : null]
          .filter(Boolean)
          .join(' ');
        return (
          <div className={cn('flex flex-col gap-2', className)}>
            <Label htmlFor={id} className="text-base font-medium">
              {label}
              {required ? (
                <span className="text-status-error" aria-hidden>
                  {' '}
                  *
                </span>
              ) : (
                <span className="font-normal text-text-muted"> (facultatif)</span>
              )}
            </Label>
            {description && (
              <p id={descriptionId} className="text-sm text-text-muted">
                {description}
              </p>
            )}
            {children({
              id,
              name: field.name,
              value: field.value ?? '',
              onChange: field.onChange,
              onBlur: field.onBlur,
              ref: field.ref,
              disabled: field.disabled,
              'aria-invalid': !!fieldState.error,
              'aria-describedby': describedBy || undefined,
              'aria-required': required || undefined,
            })}
            {fieldState.error?.message && (
              <p id={errorId} className="text-sm font-medium text-status-error">
                {fieldState.error.message}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}
