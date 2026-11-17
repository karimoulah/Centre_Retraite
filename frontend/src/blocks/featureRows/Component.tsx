import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import { CmsImage } from '@/components/site/CmsImage';
import { Section } from '@/components/site/Section';
import { resolveLink } from '@/lib/cms/payload';

import type { BlockProps } from '../types';

export function FeatureRowsBlockComponent({ id, title, text, rows }: BlockProps<'featureRows'>) {
  const headingId = `rows-${id}`;
  return (
    <Section dark labelledBy={headingId}>
      <div className="mx-auto max-w-3xl text-center">
        <h2 id={headingId} className="text-[1.75rem] md:text-[2.5rem]">
          {title}
        </h2>
        {text && <p className="mt-4 text-text-on-dark-muted">{text}</p>}
      </div>
      <ul className="mt-14 border-t border-brand-800">
        {(rows ?? []).map((row) => {
          const href = row.link?.page || row.link?.url ? resolveLink(row.link ?? {}) : null;
          return (
            <li key={row.id ?? row.title} className="relative grid items-center gap-6 border-b border-brand-800 py-8 md:grid-cols-[3fr_4fr_2fr_auto]">
              <h3 className="text-xl">
                {href ? (
                  <Link href={href} className="after:absolute after:inset-0">
                    {row.title}
                  </Link>
                ) : (
                  row.title
                )}
              </h3>
              <p className="text-[0.95rem] text-text-on-dark-muted">{row.text}</p>
              <CmsImage image={row.image} className="aspect-[4/3] w-full max-w-48" sizes="12rem" />
              {href && (
                <span aria-hidden className="flex size-11 items-center justify-center rounded-full border border-brand-800 text-accent-400">
                  <ArrowUpRight className="size-5" />
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
