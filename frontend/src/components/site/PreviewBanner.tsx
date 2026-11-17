'use client';

import { usePathname } from 'next/navigation';
import { Eye } from 'lucide-react';

/** Shown on every page while draft mode is on, so nobody mistakes a draft for the live site. */
export function PreviewBanner() {
  const pathname = usePathname();
  return (
    <div role="status" className="bg-accent-400 text-brand-900">
      <div className="mx-auto flex max-w-site flex-wrap items-center justify-between gap-3 px-6 py-2">
        <p className="flex items-center gap-2 font-medium">
          <Eye aria-hidden className="size-5" />
          Aperçu : vous voyez la dernière version enregistrée, pas encore publiée.
        </p>
        <a href={`/preview/exit?next=${encodeURIComponent(pathname)}`} className="inline-flex min-h-11 items-center font-medium underline underline-offset-4">
          Quitter l’aperçu
        </a>
      </div>
    </div>
  );
}
