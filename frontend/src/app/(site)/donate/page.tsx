import type { Metadata } from 'next';

import { DonationForm } from '@/features/donations/components/DonationForm';

export const metadata: Metadata = {
  title: 'Faire un don',
  description: "Soutenez le Centre d'accompagnement des retraités par un don en ligne sécurisé.",
};

export default function DonatePage() {
  return (
    <>
      <div className="bg-brand-900 text-text-on-dark">
        <div className="mx-auto max-w-site px-6 pt-10 pb-16">
          <h1 className="text-[2.25rem] md:text-[3.25rem]">Faire un don</h1>
          <p className="mt-4 max-w-2xl text-text-on-dark-muted">
            Vos dons financent les activités, les ateliers et l’accompagnement offerts aux aînés. Un
            courriel confirme chaque don, et un reçu fiscal est remis pour les dons admissibles.
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <DonationForm />
      </div>
    </>
  );
}
