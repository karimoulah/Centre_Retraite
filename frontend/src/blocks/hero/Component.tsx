import { Star } from 'lucide-react';

import { CmsAction } from '@/components/site/CmsAction';
import { CmsImage } from '@/components/site/CmsImage';

import type { BlockProps } from '../types';

/** Rotating circular text; stops when the user prefers reduced motion. */
function Medallion({ text }: { text: string }) {
  return (
    <div aria-hidden className="absolute top-1/2 left-0 z-10 hidden size-36 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-brand-800 bg-brand-900 lg:flex">
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full animate-[spin_24s_linear_infinite] motion-reduce:animate-none">
        <defs>
          <path id="medallion-circle" d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" />
        </defs>
        <text className="fill-text-on-dark text-[9px] font-medium tracking-[0.2em]">
          <textPath href="#medallion-circle">{text}</textPath>
        </text>
      </svg>
      <span className="bg-accent-400 size-10 rounded-full" />
    </div>
  );
}

export function HeroBlockComponent({ badge, title, text, primaryAction, image, medallion }: BlockProps<'hero'>) {
  return (
    <section aria-labelledby="hero-title" className="bg-brand-900 text-text-on-dark">
      <div className="mx-auto grid max-w-site gap-10 px-6 pt-10 pb-16 lg:grid-cols-2 lg:gap-0 lg:pt-16">
        <div className="flex flex-col justify-center lg:pr-16">
          {badge && (
            <p className="mb-6 flex items-center gap-2 text-[0.95rem] text-text-on-dark-muted">
              <span aria-hidden className="text-accent-400 flex">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className="size-4 fill-current" />
                ))}
              </span>
              {badge}
            </p>
          )}
          <h1 id="hero-title" className="text-[2.25rem] whitespace-pre-line md:text-[3.5rem]">
            {title}
          </h1>
          {text && <p className="mt-6 max-w-xl text-text-on-dark-muted">{text}</p>}
          <div className="mt-8">
            <CmsAction link={primaryAction} variant="accent" />
          </div>
        </div>
        <div className="relative">
          <CmsImage image={image} priority className="aspect-[4/5] w-full lg:aspect-auto lg:h-full lg:min-h-[32rem]" />
          {medallion && <Medallion text={medallion} />}
        </div>
      </div>
    </section>
  );
}
