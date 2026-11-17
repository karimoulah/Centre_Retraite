import { cn } from '@/lib/utils';

export type StatusTone = 'success' | 'warning' | 'error' | 'info' | 'neutral';

const tones: Record<StatusTone, string> = {
  success: 'border-status-success/30 bg-status-success/10 text-status-success',
  warning: 'border-status-warning/30 bg-status-warning/10 text-status-warning',
  error: 'border-status-error/30 bg-status-error/10 text-status-error',
  info: 'border-status-info/30 bg-status-info/10 text-status-info',
  neutral: 'border-border bg-surface-muted text-text-muted',
};

/** Status pill: always a text label, never color alone. */
export function StatusBadge({ tone, children, className }: { tone: StatusTone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-sm font-medium whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
