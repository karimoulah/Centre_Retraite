import type { Metadata } from 'next';
import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';

import { RenderBlocks } from '@/blocks/RenderBlocks';
import { siteConfig } from '@/config/site';
import { getPage } from '@/lib/cms/payload';
import { getSession, hasRole } from '@/lib/session';

export async function loadPage(slug: string) {
  const { isEnabled } = await draftMode();
  // Draft content only for administrators, even if a draft-mode cookie is left over.
  const draft = isEnabled && hasRole(await getSession(), 'ADMIN');
  const page = await getPage(slug, { draft });
  return { page, draft };
}

export async function pageMetadata(slug: string): Promise<Metadata> {
  const { page } = await loadPage(slug);
  if (!page) return {};
  const image = page.meta?.image && typeof page.meta.image === 'object' ? page.meta.image.url : undefined;
  const title = page.meta?.title || page.title;
  return {
    title: slug === 'home' ? { absolute: title } : title,
    description: page.meta?.description || siteConfig.legalName,
    alternates: { canonical: slug === 'home' ? '/' : `/${slug}` },
    openGraph: { title, description: page.meta?.description ?? undefined, locale: 'fr_CA', images: image ? [image] : undefined },
  };
}

/** CMS page: its sections in order; 404 when the page does not exist or is not published. */
export async function PageView({ slug }: { slug: string }) {
  const { page } = await loadPage(slug);
  if (!page) notFound();
  const startsWithHero = page.layout?.[0]?.blockType === 'hero';
  return (
    <>
      {!startsWithHero && (
        <div className="bg-brand-900 text-text-on-dark">
          <div className="mx-auto max-w-site px-6 pt-10 pb-16">
            <h1 className="text-[2.25rem] md:text-[3.25rem]">{page.title}</h1>
          </div>
        </div>
      )}
      <RenderBlocks blocks={page.layout} />
    </>
  );
}
