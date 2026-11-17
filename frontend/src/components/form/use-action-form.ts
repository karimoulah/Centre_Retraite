'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type DefaultValues, type FieldValues, type Path } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';

import type { ActionResult } from '@/lib/actions';

type Options<TValues extends FieldValues, TData> = {
  schema: z.ZodType<TValues, TValues>;
  action: (values: TValues) => Promise<ActionResult<TData>>;
  defaultValues?: DefaultValues<TValues>;
  onSuccess?: (data: TData | undefined) => void;
  /** Toast shown on success (falls back to the action's message). */
  successToast?: string | false;
};

/**
 * Standard form wiring: zod validation in the browser, Server Action submit,
 * API field errors mapped onto fields, other errors shown above the form.
 */
export function useActionForm<TValues extends FieldValues, TData = undefined>({
  schema,
  action,
  defaultValues,
  onSuccess,
  successToast,
}: Options<TValues, TData>) {
  const form = useForm<TValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onTouched',
  });
  const [formError, setFormError] = useState<ActionResult<TData> | null>(null);

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    const result = await action(values);
    if (result.ok) {
      const message = successToast === false ? null : (successToast ?? result.message);
      if (message) toast.success(message);
      onSuccess?.(result.data);
      return;
    }
    for (const [name, message] of Object.entries(result.fieldErrors ?? {})) {
      form.setError(name as Path<TValues>, { type: 'server', message });
    }
    setFormError(result);
  });

  return { form, onSubmit, formError, setFormError };
}
