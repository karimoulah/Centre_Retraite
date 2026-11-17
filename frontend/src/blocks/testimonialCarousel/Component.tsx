import { StatusBadge } from '@/components/backoffice/StatusBadge';
import { Section } from '@/components/site/Section';
import { getPublicTestimonials } from '@/features/testimonials/queries';

import type { BlockProps } from '../types';
import { TestimonialCarousel } from './Carousel';

export async function TestimonialCarouselBlockComponent({ id, title, text, limit }: BlockProps<'testimonialCarousel'>) {
  const reviews = await getPublicTestimonials('TEXT', limit ?? 6);
  if (reviews.length === 0) return null;
  const headingId = `reviews-${id}`;
  return (
    <Section labelledBy={headingId}>
      <div className="mb-10 grid gap-6 md:grid-cols-2 md:items-end">
        <h2 id={headingId} className="text-[1.75rem] md:text-[2.5rem]">
          {title}
        </h2>
        <div>
          {text && <p className="text-text-muted">{text}</p>}
          {reviews.some((r) => r.demo) && (
            <p className="mt-3">
              <StatusBadge tone="warning">Données de démonstration</StatusBadge>
            </p>
          )}
        </div>
      </div>
      <TestimonialCarousel items={reviews} />
    </Section>
  );
}
