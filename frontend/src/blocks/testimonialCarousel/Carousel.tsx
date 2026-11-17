'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Quote } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { PublicTestimonial } from '@/lib/api/contracts';

/** One review at a time, with round previous/next buttons; changes are announced politely. */
export function TestimonialCarousel({ items }: { items: PublicTestimonial[] }) {
  const [index, setIndex] = useState(0);
  const current = items[index];
  const go = (step: number) => setIndex((i) => (i + step + items.length) % items.length);

  return (
    <div className="grid gap-6 md:grid-cols-[2fr_3fr]">
      <div aria-hidden className="flex aspect-[4/5] items-center justify-center rounded-2xl bg-gradient-to-br from-brand-800 to-brand-900 text-6xl font-medium text-accent-400">
        {current.authorName.charAt(0)}
      </div>
      <div className="flex flex-col">
        <figure aria-live="polite" aria-atomic="true" className="flex flex-1 flex-col rounded-2xl bg-surface-muted p-8">
          <Quote aria-hidden className="size-8 text-brand-900" />
          <blockquote className="mt-4 text-xl font-medium md:text-2xl">« {current.quote} »</blockquote>
          <figcaption className="mt-auto pt-8">
            <span className="block font-medium">{current.authorName}</span>
            {current.authorDetail && <span className="block text-text-muted">{current.authorDetail}</span>}
          </figcaption>
        </figure>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-text-muted tabular-nums">
            <span className="sr-only">Avis </span>
            {index + 1} / {items.length}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" size="icon" onClick={() => go(-1)} aria-label="Avis précédent">
              <ArrowLeft aria-hidden />
            </Button>
            <Button variant="outline" size="icon" onClick={() => go(1)} aria-label="Avis suivant">
              <ArrowRight aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
