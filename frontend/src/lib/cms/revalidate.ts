import { revalidateTag } from 'next/cache';

/** Cache tag shared by every CMS read; any publish invalidates it. */
export const CMS_TAG = 'cms';

export const revalidateSite = () => {
  try {
    revalidateTag(CMS_TAG);
  } catch {
    // Outside a Next request (seed script, CLI): nothing to revalidate.
  }
};
