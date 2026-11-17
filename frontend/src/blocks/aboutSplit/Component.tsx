import { CmsImage } from '@/components/site/CmsImage';
import { Section, SectionHeading } from '@/components/site/Section';
import { getUpcomingActivities } from '@/lib/cms/payload';

import type { BlockProps } from '../types';
import { ActivitiesCard } from '../upcomingActivities/ActivitiesCard';
import { AboutAccordion } from './Accordion';

export async function AboutSplitBlockComponent({
  id,
  eyebrow,
  title,
  text,
  image,
  highlight,
  items,
  showUpcomingActivities,
}: BlockProps<'aboutSplit'>) {
  const activities = showUpcomingActivities ? await getUpcomingActivities(3) : [];
  const headingId = `about-${id}`;
  return (
    <Section labelledBy={headingId}>
      <div className={showUpcomingActivities ? 'grid gap-12 lg:grid-cols-2' : ''}>
        <div>
          <SectionHeading id={headingId} eyebrow={eyebrow} title={title} />
          {text && <p className="mt-6 max-w-xl text-text-muted">{text}</p>}
          <div className="mt-8 grid grid-cols-[3fr_2fr] gap-4">
            <CmsImage image={image} className="aspect-[4/3]" sizes="(min-width: 1024px) 25vw, 60vw" />
            {highlight?.value && (
              <div className="flex flex-col justify-between rounded-2xl bg-brand-900 p-5 text-text-on-dark">
                <span className="text-4xl font-medium">{highlight.value}</span>
                <span className="text-[0.95rem] text-text-on-dark-muted">{highlight.label}</span>
              </div>
            )}
          </div>
          {items && items.length > 0 && <AboutAccordion items={items} />}
        </div>
        {showUpcomingActivities && <ActivitiesCard activities={activities} />}
      </div>
    </Section>
  );
}
