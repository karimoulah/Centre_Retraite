import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

import { cn } from '@/lib/utils';

type EmptyStateProps = {
  title: string;
  description?: React.ReactNode;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
};

/** Shown when a list or a search returns nothing; says why and what to do next. */
export function EmptyState({ title, description, icon: Icon = Inbox, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-14 text-center', className)}>
      <span className="bg-accent-200 flex size-12 items-center justify-center rounded-full text-brand-900">
        <Icon aria-hidden className="size-6" />
      </span>
      <h2 className="mt-4 text-xl">{title}</h2>
      {description && <p className="mt-2 max-w-md text-text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
