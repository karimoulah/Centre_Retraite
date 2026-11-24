import type { EntryTotals as Totals } from '@/lib/api/contracts';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Totals of the whole selection, shown above the list (not only the visible page). */
export function EntryTotals({ totals }: { totals: Totals }) {
  const items = [
    { label: 'Recettes', value: formatMoney(totals.incomeCents) },
    { label: 'Dépenses', value: formatMoney(totals.expenseCents) },
    {
      label: 'Solde',
      value: formatMoney(totals.balanceCents),
      negative: totals.balanceCents < 0,
      strong: true,
    },
    { label: 'Écritures', value: totals.count.toLocaleString('fr-CA') },
  ];
  return (
    <section
      aria-label="Totaux de la sélection"
      className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {items.map((item) => (
        <div
          key={item.label}
          className={cn('rounded-2xl border border-border p-5', item.strong && 'border-brand-900')}
        >
          <p className="text-sm text-text-muted">{item.label}</p>
          <p
            className={cn(
              'mt-1 text-2xl font-semibold tabular-nums',
              item.negative && 'text-status-error',
            )}
          >
            {item.value}
          </p>
        </div>
      ))}
    </section>
  );
}
