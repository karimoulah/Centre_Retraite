import type { ReactNode } from 'react';
import '../(site)/site.css';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr-CA">
      <body>
        <main id="contenu">{children}</main>
      </body>
    </html>
  );
}
