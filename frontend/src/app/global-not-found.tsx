import type { Metadata } from 'next';

import { inter } from '@/app/fonts';
import { StatusPage } from '@/components/site/StatusPage';
import './(site)/site.css';

export const metadata: Metadata = { title: 'Page introuvable' };

// Rendered for any URL that matches no route (the app has one root layout per route group).
export default function GlobalNotFound() {
  return (
    <html lang="fr-CA" className={inter.variable}>
      <body>
        <main id="contenu">
          <StatusPage
            code="404"
            title="Page introuvable"
            message="La page que vous cherchez n'existe pas ou a été déplacée."
          />
        </main>
      </body>
    </html>
  );
}
