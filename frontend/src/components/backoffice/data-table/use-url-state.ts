'use client';

import { useCallback, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/** Updates query-string keys and re-renders the server page; resets to page 1 unless told otherwise. */
export function useUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const setParams = useCallback(
    (values: Record<string, string | number | null | undefined>, { keepPage = false } = {}) => {
      const params = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(values)) {
        if (value === null || value === undefined || value === '' || value === 'all') params.delete(key);
        else params.set(key, String(value));
      }
      if (!keepPage && !('page' in values)) params.delete('page');
      const query = params.toString();
      startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
    },
    [pathname, router, searchParams],
  );

  return { searchParams, setParams, isPending };
}
