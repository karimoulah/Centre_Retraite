'use client';

import { useId, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormErrorAlert } from '@/components/form/FormErrorAlert';
import type { ActionResult } from '@/lib/actions';

type ConfirmDialogProps = {
  trigger: React.ReactNode;
  title: string;
  /** The consequence of the action, in plain words. */
  consequence: React.ReactNode;
  confirmLabel: string;
  tone?: 'default' | 'destructive';
  /** Ask for a reason (e.g. refusal); confirm stays disabled until it has `reasonMinLength` characters. */
  reason?: { label: string; minLength?: number };
  onConfirm: (reason?: string) => Promise<ActionResult<unknown>>;
};

/** Every sensitive action (approve, refuse, reverse, cancel, deactivate) goes through this dialog. */
export function ConfirmDialog({
  trigger,
  title,
  consequence,
  confirmLabel,
  tone = 'default',
  reason,
  onConfirm,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<ActionResult<unknown> | null>(null);
  const reasonId = useId();
  const minLength = reason?.minLength ?? 5;
  const reasonMissing = !!reason && text.trim().length < minLength;

  async function confirm() {
    setPending(true);
    setError(null);
    const result = await onConfirm(reason ? text.trim() : undefined);
    setPending(false);
    if (result.ok) {
      setOpen(false);
      setText('');
      if (result.message) toast.success(result.message);
    } else {
      setError(result);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(value) => {
        if (!pending) setOpen(value);
        if (!value) setError(null);
      }}
    >
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-base text-text">{consequence}</AlertDialogDescription>
        </AlertDialogHeader>
        {reason && (
          <div className="flex flex-col gap-2">
            <Label htmlFor={reasonId} className="text-base font-medium">
              {reason.label}
            </Label>
            <Textarea
              id={reasonId}
              value={text}
              onChange={(event) => setText(event.target.value)}
              aria-describedby={`${reasonId}-help`}
            />
            <p id={`${reasonId}-help`} className="text-sm text-text-muted">
              Au moins {minLength} caractères. Ce motif est conservé dans le journal.
            </p>
          </div>
        )}
        <FormErrorAlert result={error} />
        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel asChild>
            <Button variant="ghost" disabled={pending}>
              Annuler
            </Button>
          </AlertDialogCancel>
          <Button
            variant={tone === 'destructive' ? 'destructive' : 'dark'}
            onClick={confirm}
            disabled={pending || reasonMissing}
          >
            {pending && <Loader2 aria-hidden className="animate-spin" />}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
