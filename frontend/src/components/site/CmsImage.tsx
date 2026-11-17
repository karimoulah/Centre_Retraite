import Image from 'next/image';
import { ImageIcon } from 'lucide-react';

import type { Media } from '@/payload-types';
import { cn } from '@/lib/utils';

type CmsImageProps = {
  image?: number | Media | null;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

/** Rounded CMS image (object-cover). Without an image, a neutral placeholder in the brand colors. */
export function CmsImage({ image, className, sizes = '(min-width: 1024px) 50vw, 100vw', priority }: CmsImageProps) {
  const media = image && typeof image === 'object' ? image : null;
  if (!media?.url) {
    return (
      <div aria-hidden className={cn('relative flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-800 to-brand-900', className)}>
        <ImageIcon className="size-10 text-text-on-dark-muted/60" />
      </div>
    );
  }
  return (
    <div className={cn('relative overflow-hidden rounded-2xl', className)}>
      <Image src={media.url} alt={media.alt ?? ''} fill sizes={sizes} priority={priority} className="object-cover" />
    </div>
  );
}
