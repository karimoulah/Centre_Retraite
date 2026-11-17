import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

import { requireRole } from '@/lib/session';

/** Turns on draft mode for an administrator and opens the page (Payload "Aperçu" button). */
export async function GET(request: Request) {
  await requireRole('ADMIN');
  const slug = new URL(request.url).searchParams.get('slug') ?? 'home';
  (await draftMode()).enable();
  redirect(slug === 'home' ? '/' : `/${slug.replace(/^\/+/, '')}`);
}
