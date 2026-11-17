import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { DetailList } from '@/components/backoffice/DetailList';
import { PageHeader } from '@/components/backoffice/PageHeader';
import { FormAlert } from '@/components/form';
import { MembershipDecision } from '@/features/memberships/components/MembershipDecision';
import { MembershipStatusBadge } from '@/features/memberships/components/MembershipStatusBadge';
import { getMembershipRequest } from '@/features/memberships/queries';
import { AGE_CATEGORY_LABELS } from '@/lib/api/contracts';
import { isApiError } from '@/lib/api/errors';
import { formatDate, formatDateTime } from '@/lib/format';
import { requireRole } from '@/lib/session';

export const metadata: Metadata = { title: "Demande d'adhésion" };

type Props = { params: Promise<{ id: string }> };

export default async function MembershipRequestPage({ params }: Props) {
  await requireRole('ADMIN');
  const { id } = await params;
  const request = await getMembershipRequest(id).catch((error) => {
    if (isApiError(error) && error.status === 404) notFound();
    throw error;
  });
  const yesNo = (value: boolean) => (value ? 'Oui' : 'Non');

  return (
    <>
      <PageHeader
        title={`${request.firstName} ${request.lastName}`}
        description={
          <span className="flex flex-wrap items-center gap-3">
            <MembershipStatusBadge status={request.status} />
            Reçue le {formatDateTime(request.submittedAt)}
          </span>
        }
        actions={request.status === 'PENDING' ? <MembershipDecision request={request} /> : undefined}
      />
      {request.status !== 'PENDING' && (
        <FormAlert tone={request.status === 'APPROVED' ? 'success' : 'info'} className="mb-8">
          {request.status === 'APPROVED' ? 'Approuvée' : 'Refusée'} le {request.decidedAt ? formatDateTime(request.decidedAt) : '—'} par {request.decidedBy}.
          {request.rejectionReason && <> Motif : {request.rejectionReason}</>}
          {request.memberId && (
            <>
              {' '}
              <Link href={`/backoffice/members/${request.memberId}`} className="font-medium underline">
                Voir la fiche de membre
              </Link>
            </>
          )}
        </FormAlert>
      )}
      <section aria-labelledby="details" className="rounded-2xl border border-border p-6">
        <h2 id="details" className="mb-6 text-xl">
          Renseignements fournis
        </h2>
        <DetailList
          items={[
            { label: 'Courriel', value: request.email },
            { label: 'Téléphone', value: request.phone || null },
            { label: 'Adresse', value: request.address || null },
            { label: 'Catégorie d’âge', value: AGE_CATEGORY_LABELS[request.ageCategory] },
            { label: 'Date de naissance', value: request.birthDate ? formatDate(`${request.birthDate}T12:00:00`) : null },
            { label: 'Vœux d’anniversaire', value: yesNo(request.birthdayWishesConsent) },
            { label: 'Nouvelles et calendrier', value: yesNo(request.newsletterConsent) },
          ]}
        />
      </section>
    </>
  );
}
