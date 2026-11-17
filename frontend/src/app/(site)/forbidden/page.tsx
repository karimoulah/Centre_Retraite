import type { Metadata } from 'next';

import { StatusPage } from '@/components/site/StatusPage';

export const metadata: Metadata = { title: 'Accès refusé', robots: { index: false } };

export default function ForbiddenPage() {
  return (
    <StatusPage
      code="403"
      title="Accès refusé"
      message="Votre compte n'a pas les droits nécessaires pour ouvrir cette page. Si vous pensez que c'est une erreur, communiquez avec un administrateur."
    />
  );
}
