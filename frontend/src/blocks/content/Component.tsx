import { RichText } from '@payloadcms/richtext-lexical/react';

import { Section } from '@/components/site/Section';

import type { BlockProps } from '../types';

export function ContentBlockComponent({ id, title, body }: BlockProps<'content'>) {
  const headingId = title ? `content-${id}` : undefined;
  return (
    <Section labelledBy={headingId}>
      <div className="mx-auto max-w-3xl">
        {title && (
          <h2 id={headingId} className="mb-6 text-[1.75rem] md:text-[2.5rem]">
            {title}
          </h2>
        )}
        <RichText
          data={body}
          className="flex flex-col gap-4 [&_a]:underline [&_h2]:mt-6 [&_h2]:text-3xl [&_h3]:mt-4 [&_h3]:text-2xl [&_li]:ml-6 [&_ol]:list-decimal [&_ul]:list-disc"
        />
      </div>
    </Section>
  );
}
