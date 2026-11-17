import Image from 'next/image';

import { cn } from '@/lib/utils';

import type { BlockProps } from '../types';

export function LogoStripBlockComponent({ title, logos, theme }: BlockProps<'logoStrip'>) {
  const dark = theme === 'dark';
  return (
    <section aria-label={title ?? 'Nos partenaires'} className={cn(dark ? 'bg-brand-900 text-text-on-dark' : 'bg-surface text-text')}>
      <ul className={cn('mx-auto flex max-w-site flex-wrap items-center justify-center gap-x-12 gap-y-6 px-6 py-10 md:justify-between', dark && 'border-t border-brand-800')}>
        {(logos ?? []).map((logo) => {
          const media = logo.logo && typeof logo.logo === 'object' ? logo.logo : null;
          const content = media?.url ? (
            <Image src={media.url} alt={logo.name} width={140} height={40} className="h-10 w-auto object-contain opacity-80" />
          ) : (
            <span className={cn('text-xl font-medium tracking-tight', dark ? 'text-text-on-dark-muted' : 'text-text-muted')}>{logo.name}</span>
          );
          return (
            <li key={logo.id ?? logo.name}>
              {logo.url ? (
                <a href={logo.url} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center rounded-full">
                  {content}
                  <span className="sr-only"> (nouvel onglet)</span>
                </a>
              ) : (
                content
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
