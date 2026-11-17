import { ContactCards } from '@/components/site/ContactCards';
import { Section } from '@/components/site/Section';
import { getSiteSettings } from '@/lib/cms/payload';

import type { BlockProps } from '../types';

export async function ContactCardsBlockComponent({ id, title }: BlockProps<'contactCards'>) {
  const settings = await getSiteSettings();
  const headingId = `contact-${id}`;
  return (
    <Section dark labelledBy={headingId}>
      <h2 id={headingId} className="mb-10 text-center text-[1.75rem] md:text-[2.5rem]">
        {title}
      </h2>
      <ContactCards settings={settings} />
    </Section>
  );
}
