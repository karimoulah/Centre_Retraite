import type { Metadata } from 'next';

import { MembershipForm } from '@/features/memberships/components/MembershipForm';

export const metadata: Metadata = {
  title: 'Devenir membre',
  description: "Demande d'adhésion au Centre d'accompagnement des retraités.",
};

export default function MembershipPage() {
  return (
    <>
      <div className="bg-brand-900 text-text-on-dark">
        <div className="mx-auto max-w-site px-6 pt-10 pb-16">
          <h1 className="text-[2.25rem] md:text-[3.25rem]">Devenir membre</h1>
          <p className="mt-4 max-w-2xl text-text-on-dark-muted">
            L’adhésion vous donne accès aux activités, aux ateliers et à l’accompagnement du Centre. Remplissez ce
            formulaire : l’équipe vous confirmera votre adhésion par courriel.
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <p className="mb-8 text-text-muted">
          Les champs marqués d’un <span aria-hidden className="text-status-error">*</span>
          <span className="sr-only">astérisque</span> sont obligatoires.
        </p>
        <MembershipForm />
      </div>
    </>
  );
}
