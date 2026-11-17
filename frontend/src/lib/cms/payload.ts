import 'server-only';

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import configPromise from '@payload-config';
import { getPayload } from 'payload';

import type { FooterMenu, MainMenu, Page, SiteSetting } from '@/payload-types';

import { CMS_TAG } from './revalidate';

export const getPayloadClient = cache(() => getPayload({ config: configPromise }));

/** Cached CMS read, invalidated by revalidateSite() when content is published. */
const cmsCache = <T,>(key: string, read: () => Promise<T>) =>
  cache(unstable_cache(read, [key], { tags: [CMS_TAG] }));

export const getSiteSettings = cmsCache('siteSettings', async (): Promise<SiteSetting> => {
  const payload = await getPayloadClient();
  return payload.findGlobal({ slug: 'siteSettings', depth: 0 });
});

export const getMainMenu = cmsCache('mainMenu', async (): Promise<MainMenu> => {
  const payload = await getPayloadClient();
  return payload.findGlobal({ slug: 'mainMenu', depth: 1 });
});

export const getFooterMenus = cmsCache('footerMenus', async (): Promise<FooterMenu> => {
  const payload = await getPayloadClient();
  return payload.findGlobal({ slug: 'footerMenus', depth: 1 });
});

type CmsLink = {
  type?: ('page' | 'url') | null;
  page?: (number | Page) | null;
  url?: string | null;
};

/** href for a CMS link field; the "home" page maps to "/". */
export function resolveLink(link: CmsLink): string {
  if (link.type === 'url') return link.url || '#';
  if (link.page && typeof link.page === 'object') return link.page.slug === 'home' ? '/' : `/${link.page.slug}`;
  return '#';
}
