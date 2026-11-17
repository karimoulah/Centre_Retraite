import { Plus } from 'lucide-react';

import { cn } from '@/lib/utils';

/** Page section: 96–128 px vertical rhythm on desktop, 64 px on mobile, 1200 px container. */
export function Section({
  children,
  className,
  dark = false,
  id,
  labelledBy,
}: {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
  id?: string;
  labelledBy?: string;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn(dark && 'bg-brand-900 text-text-on-dark', className)}>
      <div className="mx-auto max-w-site px-6 py-16 md:py-28">{children}</div>
    </section>
  );
}

/** Eyebrow (+ icon) and H2, as in the mockup. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  className,
  dark = false,
}: {
  id?: string;
  eyebrow?: string | null;
  title: string;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div className={className}>
      {eyebrow && (
        <p className={cn('mb-3 flex items-center gap-2 text-[0.95rem] font-medium', dark ? 'text-text-on-dark-muted' : 'text-text-muted')}>
          <Plus aria-hidden className="size-4" />
          {eyebrow}
        </p>
      )}
      <h2 id={id} className="text-[1.75rem] md:text-[2.5rem]">
        {title}
      </h2>
    </div>
  );
}
