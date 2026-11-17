import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { resolveLink } from '@/lib/cms/payload';
import type { Page } from '@/payload-types';

export type CmsLinkValue = {
  label?: string | null;
  type?: ('page' | 'url') | null;
  page?: (number | Page) | null;
  url?: string | null;
} | null | undefined;

/** Pill button from a CMS link group; renders nothing when the label is empty. */
export function CmsAction({ link, variant = 'dark' }: { link: CmsLinkValue; variant?: 'dark' | 'accent' | 'outline' | 'outlineOnDark' }) {
  if (!link?.label) return null;
  return (
    <Button asChild variant={variant}>
      <Link href={resolveLink(link)}>
        {link.label}
        <ArrowUpRight aria-hidden />
      </Link>
    </Button>
  );
}
