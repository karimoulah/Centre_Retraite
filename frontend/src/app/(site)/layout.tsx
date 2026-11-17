import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { draftMode } from 'next/headers';

import { inter } from '@/app/fonts';
import { Footer } from '@/components/site/Footer';
import { Header } from '@/components/site/Header';
import { PreviewBanner } from '@/components/site/PreviewBanner';
import { HydrationMarker } from '@/components/HydrationMarker';
import { Toaster } from '@/components/ui/sonner';
import { siteConfig } from '@/config/site';
import './site.css';

// Pages read the CMS on each request; CMS reads are cached and invalidated on publish.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:5173'),
  title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
  description: siteConfig.legalName,
};

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const { isEnabled: preview } = await draftMode();
  return (
    <html lang="fr-CA" className={inter.variable}>
      <body className="flex min-h-svh flex-col">
        <a className="skip-link" href="#contenu">
          Aller au contenu
        </a>
        {preview && <PreviewBanner />}
        <Header />
        <main id="contenu" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <Footer />
        <Toaster />
        <HydrationMarker />
      </body>
    </html>
  );
}
