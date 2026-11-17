import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { siteConfig } from '@/config/site';
import './site.css';

export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
  description: siteConfig.legalName,
};

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr-CA">
      <body>
        <a className="skip-link" href="#contenu">
          Aller au contenu
        </a>
        <main id="contenu">{children}</main>
      </body>
    </html>
  );
}
