import 'server-only';

import { api } from '@/lib/api/api';
import type { Paginated, PublicTestimonial } from '@/lib/api/contracts';

/** Approved testimonials for the public site; [] if the API (module F10) is not available yet. */
export async function getPublicTestimonials(type: PublicTestimonial['type'], limit: number) {
  try {
    const page = await api<Paginated<PublicTestimonial>>('/public/testimonials', {
      query: { type, pageSize: limit },
      redirectOnUnauthorized: false,
    });
    return page.items;
  } catch {
    return [];
  }
}
