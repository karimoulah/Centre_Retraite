import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { inter } from '@/app/fonts';
import { HydrationMarker } from '@/components/HydrationMarker';
import { Toaster } from '@/components/ui/sonner';
import { siteConfig } from '@/config/site';
import './backoffice.css';

export const metadata: Metadata = {
  title: { default: 'Back-office', template: `%s · Back-office · ${siteConfig.name}` },
  robots: { index: false, follow: false },
};

export default function BackofficeLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr-CA" className={inter.variable}>
      <body>
        {children}
        <Toaster />
        <HydrationMarker />
      </body>
    </html>
  );
}
