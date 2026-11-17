import { AlertCircle, CheckCircle2 } from 'lucide-react';

import { cn } from '@/lib/utils';

type FormAlertProps = {
  tone?: 'error' | 'success' | 'info';
  title?: string;
  children: React.ReactNode;
  className?: string;
};

/** Message above a form, announced to screen readers. */
export function FormAlert({ tone = 'error', title, children, className }: FormAlertProps) {
  const Icon = tone === 'success' ? CheckCircle2 : AlertCircle;
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
      className={cn(
        'flex gap-3 rounded-2xl border p-4',
        tone === 'error' && 'border-status-error/30 bg-status-error/5 text-status-error',
        tone === 'success' && 'border-status-success/30 bg-status-success/5 text-status-success',
        tone === 'info' && 'border-status-info/30 bg-status-info/5 text-text',
        className,
      )}
    >
      <Icon aria-hidden className="mt-0.5 size-5 shrink-0" />
      <div>
        {title && <p className="font-medium">{title}</p>}
        <div className={cn(title && 'mt-1', 'text-text')}>{children}</div>
      </div>
    </div>
  );
}
