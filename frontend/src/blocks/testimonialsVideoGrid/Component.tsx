import { Play } from 'lucide-react';

import { CmsAction } from '@/components/site/CmsAction';
import { StatusBadge } from '@/components/backoffice/StatusBadge';
import { Section } from '@/components/site/Section';
import { getPublicTestimonials } from '@/features/testimonials/queries';
import { cn } from '@/lib/utils';

import type { BlockProps } from '../types';

const duration = (seconds?: number | null) =>
  seconds ? `${Math.floor(seconds / 60)} min ${String(seconds % 60).padStart(2, '0')} s` : null;

export async function TestimonialsVideoGridBlockComponent({ id, title, text, action, limit }: BlockProps<'testimonialsVideoGrid'>) {
  const videos = await getPublicTestimonials('VIDEO', limit ?? 3);
  if (videos.length === 0) return null;
  const headingId = `videos-${id}`;
  const isDemo = videos.some((v) => v.demo);

  return (
    <Section labelledBy={headingId}>
      <div className="grid gap-10 lg:grid-cols-[2fr_3fr]">
        <div>
          <h2 id={headingId} className="text-[1.75rem] md:text-[2.5rem]">
            {title}
          </h2>
          {text && <p className="mt-4 max-w-md text-text-muted">{text}</p>}
          {isDemo && (
            <p className="mt-4">
              <StatusBadge tone="warning">Données de démonstration</StatusBadge>
            </p>
          )}
          <div className="mt-8">
            <CmsAction link={action} />
          </div>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 sm:grid-rows-2">
          {videos.map((video, index) => (
            <li
              key={video.id}
              className={cn(
                'relative flex min-h-60 flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-br from-brand-800 to-brand-900 p-5 text-text-on-dark',
                index === 1 && 'sm:row-span-2 sm:min-h-full',
              )}
            >
              <span aria-hidden className="absolute top-5 left-5 flex size-14 items-center justify-center rounded-full bg-surface text-brand-900">
                <Play className="size-6 fill-current" />
              </span>
              <p className="relative font-medium">« {video.quote} »</p>
              <p className="relative mt-1 text-sm text-text-on-dark-muted">
                {video.authorName}
                {video.durationSeconds ? ` · ${duration(video.durationSeconds)}` : ''}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
