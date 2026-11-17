import { cn } from '@/lib/utils';

export type StatusTone = 'success' | 'warning' | 'error' | 'info' | 'neutral';

const tones: Record<StatusTone, string> = {
  // Dark text on a light tint keeps AA contrast; the colored dot and border carry the status.
  success: 'border-status-success/40 bg-status-success/10 [&>span]:bg-status-success',
  warning: 'border-status-warning/40 bg-status-warning/10 [&>span]:bg-status-warning',
  error: 'border-status-error/40 bg-status-error/10 [&>span]:bg-status-error',
  info: 'border-status-info/40 bg-status-info/10 [&>span]:bg-status-info',
  neutral: 'border-border bg-surface-muted [&>span]:bg-text-muted',
};

/** Status pill: always a text label, never color alone. */
export function StatusBadge({ tone, children, className }: { tone: StatusTone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-sm font-medium whitespace-nowrap text-text',
        tones[tone],
        className,
      )}
    >
      <span aria-hidden className="size-2 rounded-full" />
      {children}
    </span>
  );
}
