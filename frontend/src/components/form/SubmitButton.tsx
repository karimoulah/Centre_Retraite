'use client';

import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

type SubmitButtonProps = React.ComponentProps<typeof Button> & {
  pending: boolean;
  pendingLabel?: string;
};

/** Submit button disabled while the form is being sent. */
export function SubmitButton({ pending, pendingLabel = 'Envoi…', children, ...props }: SubmitButtonProps) {
  return (
    <Button type="submit" disabled={pending || props.disabled} aria-disabled={pending} {...props}>
      {pending && <Loader2 aria-hidden className="animate-spin" />}
      {pending ? pendingLabel : children}
    </Button>
  );
}
