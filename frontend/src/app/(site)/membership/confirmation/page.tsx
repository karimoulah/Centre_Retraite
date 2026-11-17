import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Demande reçue', robots: { index: false } };

type Props = { searchParams: Promise<{ status?: string }> };

export default async function MembershipConfirmationPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const approved = status === 'APPROVED';
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <CheckCircle2 aria-hidden className="mx-auto size-14 text-status-success" />
      <h1 className="mt-6 text-[2.25rem]">{approved ? 'Bienvenue au Centre !' : 'Merci, votre demande est reçue'}</h1>
      <p className="mt-4 text-text-muted">
        {approved
          ? 'Votre adhésion est confirmée. Vous recevrez un courriel avec votre numéro de membre et le calendrier des activités.'
          : 'L’équipe du Centre étudie votre demande et vous répondra par courriel, généralement en moins de 3 jours ouvrables.'}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Button asChild variant="dark">
          <Link href="/">Retour à l’accueil</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/contact">Une question ? Nous joindre</Link>
        </Button>
      </div>
    </div>
  );
}
