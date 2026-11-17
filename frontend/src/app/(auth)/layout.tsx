import type { ReactNode } from 'react';
import { inter } from '@/app/fonts';
import '../(site)/site.css';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr-CA" className={inter.variable}>
      <body>
        <main id="contenu">{children}</main>
      </body>
    </html>
  );
}
