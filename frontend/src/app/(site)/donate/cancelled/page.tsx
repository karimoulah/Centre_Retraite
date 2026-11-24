import type { Metadata } from 'next';
import Link from 'next/link';
import { HeartHandshake } from 'lucide-react';

import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Don annulé', robots: { index: false } };

export default function DonationCancelledPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <HeartHandshake aria-hidden className="mx-auto size-14 text-brand-900" />
      <h1 className="mt-6 text-[2.25rem]">Votre don a été annulé</h1>
      <p className="mt-4 text-text-muted">
        Aucun montant n’a été prélevé. Vous pouvez recommencer quand vous le souhaitez, ou donner
        par téléphone ou en personne au Centre.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Button asChild variant="dark">
          <Link href="/donate">Recommencer mon don</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/contact">Nous joindre</Link>
        </Button>
      </div>
    </div>
  );
}
