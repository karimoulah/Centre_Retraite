import { CmsAction } from '@/components/site/CmsAction';
import { CmsImage } from '@/components/site/CmsImage';
import { Section, SectionHeading } from '@/components/site/Section';
import { resolveLink } from '@/lib/cms/payload';

import type { BlockProps } from '../types';
import { ServicesExplorer } from './ServicesExplorer';

export function ServicesListBlockComponent({ id, eyebrow, title, action, services }: BlockProps<'servicesList'>) {
  const headingId = `services-${id}`;
  const items = (services ?? []).map((service, index) => ({
    key: service.id ?? String(index),
    title: service.title,
    description: service.description,
    href: service.link?.page || service.link?.url ? resolveLink(service.link ?? {}) : null,
    linkLabel: service.link?.label || 'En savoir plus',
    image: <CmsImage image={service.image} className="aspect-[4/3]" sizes="(min-width: 1024px) 25vw, 90vw" />,
  }));
  return (
    <Section labelledBy={headingId}>
      <div className="grid gap-10 lg:grid-cols-[2fr_5fr]">
        <div>
          <SectionHeading id={headingId} eyebrow={eyebrow} title={title} />
          <div className="mt-8">
            <CmsAction link={action} />
          </div>
        </div>
        <ServicesExplorer services={items} />
      </div>
    </Section>
  );
}
