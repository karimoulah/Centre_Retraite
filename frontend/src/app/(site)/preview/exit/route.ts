import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

import { safeNext } from '@/lib/session';

export async function GET(request: Request) {
  (await draftMode()).disable();
  redirect(safeNext(new URL(request.url).searchParams.get('next')) ?? '/');
}
