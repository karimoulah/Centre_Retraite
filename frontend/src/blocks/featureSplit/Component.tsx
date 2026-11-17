import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import { CmsAction } from '@/components/site/CmsAction';
import { CmsImage } from '@/components/site/CmsImage';
import { Section } from '@/components/site/Section';
import { resolveLink } from '@/lib/cms/payload';

import type { BlockProps } from '../types';

export function FeatureSplitBlockComponent({ id, image, title, action, cards }: BlockProps<'featureSplit'>) {
  const headingId = `feature-${id}`;
  return (
    <Section labelledBy={headingId}>
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <CmsImage image={image} className="aspect-[4/5] lg:aspect-auto lg:min-h-[34rem]" />
        <div className="flex flex-col">
          <h2 id={headingId} className="text-[1.75rem] whitespace-pre-line md:text-[2.5rem]">
            {title}
          </h2>
          <div className="mt-8">
            <CmsAction link={action} />
          </div>
          <ul className="mt-auto grid gap-4 pt-12 sm:grid-cols-2">
            {(cards ?? []).map((card, index) => {
              const href = card.link?.label || card.link?.page || card.link?.url ? resolveLink(card.link ?? {}) : null;
              return (
                <li key={card.id ?? card.title} className="relative flex min-h-56 flex-col rounded-2xl bg-surface-muted p-6">
                  <div className="flex items-start justify-between">
                    <span className="text-text-muted tabular-nums">{String(index + 1).padStart(2, '0')}</span>
                    {href && (
                      <span aria-hidden className="flex size-11 items-center justify-center rounded-full border border-border bg-surface">
                        <ArrowUpRight className="size-5" />
                      </span>
                    )}
                  </div>
                  <h3 className="mt-auto text-xl">
                    {href ? (
                      <Link href={href} className="after:absolute after:inset-0 after:rounded-2xl">
                        {card.title}
                      </Link>
                    ) : (
                      card.title
                    )}
                  </h3>
                  {card.text && <p className="mt-2 text-[0.95rem] text-text-muted">{card.text}</p>}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Section>
  );
}
