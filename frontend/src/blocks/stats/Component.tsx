import { cn } from '@/lib/utils';

import type { BlockProps } from '../types';

export function StatsBlockComponent({ items, theme }: BlockProps<'stats'>) {
  const dark = theme === 'dark';
  return (
    <section aria-label="Chiffres clés" className={cn(dark ? 'bg-brand-900 text-text-on-dark' : 'bg-surface')}>
      <dl className="mx-auto grid max-w-site grid-cols-1 gap-8 px-6 py-10 sm:grid-cols-3 md:py-12">
        {(items ?? []).map((item) => (
          <div key={item.id ?? item.label} className="flex flex-col-reverse gap-1">
            <dt className={cn(dark ? 'text-text-on-dark-muted' : 'text-text-muted')}>{item.label}</dt>
            <dd className="text-4xl font-medium tracking-tight">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
