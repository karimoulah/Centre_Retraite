import { Section, SectionHeading } from '@/components/site/Section';
import { getUpcomingActivities } from '@/lib/cms/payload';

import type { BlockProps } from '../types';
import { ActivitiesCard } from './ActivitiesCard';

export async function UpcomingActivitiesBlockComponent({ id, eyebrow, title, text, limit }: BlockProps<'upcomingActivities'>) {
  const activities = await getUpcomingActivities(limit ?? 6);
  const headingId = `activities-${id}`;
  return (
    <Section labelledBy={headingId}>
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <SectionHeading id={headingId} eyebrow={eyebrow} title={title} />
          {text && <p className="mt-6 max-w-xl text-text-muted">{text}</p>}
        </div>
        <ActivitiesCard activities={activities} />
      </div>
    </Section>
  );
}
