import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/api';
import type { DonationStatus } from '@/lib/api/contracts';
import { formatMoney } from '@/lib/format';

export const metadata: Metadata = { title: 'Merci pour votre don', robots: { index: false } };
export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ session_id?: string }> };

/** Return page of the payment provider. The gift counts only once the provider has confirmed it (webhook). */
export default async function ThankYouPage({ searchParams }: Props) {
  const { session_id: sessionId } = await searchParams;
  const donation = sessionId
    ? await api<DonationStatus>(`/donations/sessions/${encodeURIComponent(sessionId)}`, {
        redirectOnUnauthorized: false,
      }).catch(() => null)
    : null;
  const status = donation?.status;

  const view =
    status === 'CONFIRMED' || status === 'REFUNDED'
      ? {
          icon: CheckCircle2,
          tone: 'text-status-success',
          title: 'Merci pour votre don !',
          text: `Votre don de ${formatMoney(donation!.amountCents)} est confirmé. Un courriel de confirmation vous a été envoyé.`,
        }
      : status === 'PENDING'
        ? {
            icon: Clock,
            tone: 'text-status-info',
            title: 'Merci ! Votre paiement est en cours de confirmation',
            text: 'Votre banque confirme le paiement : cela prend en général quelques secondes, parfois quelques jours pour un virement. Vous recevrez un courriel dès qu’il sera confirmé.',
          }
        : status
          ? {
              icon: XCircle,
              tone: 'text-status-error',
              title: 'Le paiement n’a pas abouti',
              text: 'Aucun montant n’a été prélevé. Vous pouvez réessayer ou nous joindre.',
            }
          : {
              icon: CheckCircle2,
              tone: 'text-status-success',
              title: 'Merci pour votre soutien',
              text: 'Si vous venez de faire un don, vous recevrez un courriel de confirmation dès que le paiement sera confirmé.',
            };
  const Icon = view.icon;

  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      {status === 'PENDING' && <meta httpEquiv="refresh" content="5" />}
      <Icon aria-hidden className={`mx-auto size-14 ${view.tone}`} />
      <h1 className="mt-6 text-[2.25rem]">{view.title}</h1>
      <p className="mt-4 text-text-muted" role="status">
        {view.text}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Button asChild variant="dark">
          <Link href="/">Retour à l’accueil</Link>
        </Button>
        {status && status !== 'CONFIRMED' && status !== 'PENDING' && status !== 'REFUNDED' ? (
          <Button asChild variant="outline">
            <Link href="/donate">Réessayer</Link>
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link href="/contact">Une question ? Nous joindre</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
