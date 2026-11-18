import Link from 'next/link';

import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

/** Text logo: lime mark + site name. Replace the mark with the Centre's SVG when available. */
export function Logo({ className, tone = 'dark' }: { className?: string; tone?: 'dark' | 'light' }) {
  return (
    <Link
      href="/"
      className={cn(
        'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full text-xl font-medium tracking-tight whitespace-nowrap',
        tone === 'dark' ? 'text-text-on-dark' : 'text-brand-900',
        className,
      )}
    >
      <span aria-hidden className="bg-accent-400 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-brand-900">
        A
      </span>
      <span>
        {siteConfig.name}
        <span className="sr-only"> — accueil</span>
      </span>
    </Link>
  );
}
