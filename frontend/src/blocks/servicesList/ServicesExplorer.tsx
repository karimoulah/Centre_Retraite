'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { cn } from '@/lib/utils';

export type ServiceItem = { key: string; title: string; description: string; href: string | null; linkLabel: string; image: React.ReactNode };

/** Service list; hovering or focusing an item shows its preview (image + text) on the right. */
export function ServicesExplorer({ services }: { services: ServiceItem[] }) {
  const [active, setActive] = useState(0);
  const current = services[active];
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <ul className="border-t border-border">
        {services.map((service, index) => (
          <li key={service.key} className="border-b border-border">
            <button
              type="button"
              onMouseEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              onClick={() => setActive(index)}
              aria-pressed={index === active}
              aria-controls="service-preview"
              className={cn(
                'my-1 flex min-h-12 w-full items-center justify-between rounded-xl px-4 text-left transition-colors',
                index === active ? 'bg-accent-200 font-medium text-brand-900' : 'hover:bg-surface-muted',
              )}
            >
              {service.title}
              {index === active && <ArrowRight aria-hidden className="size-5" />}
            </button>
          </li>
        ))}
      </ul>
      {current && (
        <div id="service-preview" aria-live="polite" className="flex flex-col gap-4">
          {current.image}
          <h3 className="text-xl">{current.title}</h3>
          <p className="text-text-muted">{current.description}</p>
          {current.href && (
            <Link href={current.href} className="inline-flex min-h-11 items-center gap-2 font-medium underline-offset-4 hover:underline">
              {current.linkLabel}
              <ArrowRight aria-hidden className="size-4" />
              <span className="sr-only"> : {current.title}</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
