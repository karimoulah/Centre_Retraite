import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { siteConfig } from '@/config/site';
import './backoffice.css';

export const metadata: Metadata = {
  title: { default: 'Back-office', template: `%s · Back-office · ${siteConfig.name}` },
  robots: { index: false, follow: false },
};

export default function BackofficeLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr-CA">
      <body>{children}</body>
    </html>
  );
}
