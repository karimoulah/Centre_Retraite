import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { inter } from '@/app/fonts';
import { Logo } from '@/components/site/Logo';
import { HydrationMarker } from '@/components/HydrationMarker';
import { Toaster } from '@/components/ui/sonner';
import { siteConfig } from '@/config/site';
import '../(site)/site.css';

export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
  robots: { index: false },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr-CA" className={inter.variable}>
      <body>
        <a className="skip-link" href="#contenu">
          Aller au contenu
        </a>
        <div className="grid min-h-svh lg:grid-cols-[5fr_7fr]">
          <aside className="flex flex-col justify-between bg-brand-900 p-8 text-text-on-dark lg:p-12">
            <Logo />
            <div className="hidden lg:block">
              <p className="max-w-md text-4xl font-medium tracking-tight">
                Votre espace au Centre d&apos;accompagnement des retraités.
              </p>
              <p className="mt-4 max-w-md text-text-on-dark-muted">
                Membres : gérez votre profil et vos consentements. Équipe : accédez au back-office.
              </p>
            </div>
            <p className="hidden text-sm text-text-on-dark-muted lg:block">{siteConfig.legalName}</p>
          </aside>
          <main id="contenu" className="flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md">{children}</div>
          </main>
        </div>
        <Toaster />
        <HydrationMarker />
      </body>
    </html>
  );
}
