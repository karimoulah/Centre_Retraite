import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import { EmptyState } from '@/components/backoffice/EmptyState';
import { PageHeader } from '@/components/backoffice/PageHeader';
import { navFor } from '@/config/backoffice-nav';
import { requireRole } from '@/lib/session';

export const metadata: Metadata = { title: 'Accueil' };

const descriptions: Record<string, string> = {
  '/backoffice/memberships': 'Approuver ou refuser les nouvelles demandes.',
  '/backoffice/members': 'Rechercher un membre, mettre à jour sa fiche.',
  '/backoffice/users': "Comptes de l'équipe, rôles et invitations.",
  '/backoffice/audit': 'Qui a fait quoi, et quand.',
  '/backoffice/settings': "Approbation automatique et autres réglages.",
  '/admin': 'Pages, menus et coordonnées du site public.',
};

// Role-based shortcuts; replaced by the dashboard in Sprint 3 (F7-01).
export default async function BackofficeHomePage() {
  const user = await requireRole('ADMIN', 'FINANCE', 'TESTIMONIALS');
  const shortcuts = navFor(user.roles)
    .flatMap((group) => group.items)
    .filter((item) => item.href !== '/backoffice');

  return (
    <>
      <PageHeader title={`Bonjour ${user.firstName}`} description="Voici les raccourcis vers les tâches de votre rôle." />
      {shortcuts.length === 0 ? (
        <EmptyState
          title="Vos écrans arrivent bientôt"
          description="Les modules Finances et Témoignages seront disponibles aux prochains sprints. Vous serez redirigé ici automatiquement."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shortcuts.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                {...(item.external ? { target: '_blank', rel: 'noopener' } : {})}
                className="group flex h-full flex-col gap-3 rounded-2xl bg-surface-muted p-6 transition-colors hover:bg-accent-200"
              >
                <span className="flex items-center justify-between">
                  <span className="bg-accent-400 flex size-11 items-center justify-center rounded-full text-brand-900">
                    <item.icon aria-hidden className="size-5" />
                  </span>
                  <span className="flex size-11 items-center justify-center rounded-full border border-border bg-surface">
                    <ArrowUpRight aria-hidden className="size-5" />
                  </span>
                </span>
                <span className="text-xl font-medium">
                  {item.label}
                  {item.external && <span className="sr-only"> (nouvel onglet)</span>}
                </span>
                <span className="text-text-muted">{descriptions[item.href]}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
