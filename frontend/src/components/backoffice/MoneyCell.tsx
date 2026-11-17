import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Right-aligned amount in cents, tabular figures, negative amounts in red. */
export function MoneyCell({ cents, className }: { cents: number; className?: string }) {
  return (
    <span className={cn('block text-right tabular-nums', cents < 0 && 'text-status-error', className)}>
      {formatMoney(cents)}
    </span>
  );
}
