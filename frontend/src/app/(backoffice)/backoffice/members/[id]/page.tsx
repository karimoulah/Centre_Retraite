import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { DetailList } from '@/components/backoffice/DetailList';
import { PageHeader } from '@/components/backoffice/PageHeader';
import { StatusBadge } from '@/components/backoffice/StatusBadge';
import { MemberEditor } from '@/features/memberships/components/MemberEditor';
import { getMember } from '@/features/memberships/queries';
import type { Consent } from '@/lib/api/contracts';
import { isApiError } from '@/lib/api/errors';
import { formatDate, formatDateTime } from '@/lib/format';
import { requireRole } from '@/lib/session';

export const metadata: Metadata = { title: 'Membre' };

type Props = { params: Promise<{ id: string }> };

const consentText = (consent: Consent) =>
  consent.granted ? `Oui${consent.updatedAt ? `, depuis le ${formatDate(consent.updatedAt)}` : ''}` : 'Non';

export default async function MemberPage({ params }: Props) {
  await requireRole('ADMIN');
  const { id } = await params;
  const member = await getMember(id).catch((error) => {
    if (isApiError(error) && error.status === 404) notFound();
    throw error;
  });

  return (
    <>
      <PageHeader
        title={`${member.firstName} ${member.lastName}`}
        description={
          <span className="flex flex-wrap items-center gap-3">
            {member.active ? <StatusBadge tone="success">Actif</StatusBadge> : <StatusBadge tone="neutral">Désactivé</StatusBadge>}
            <span className="tabular-nums">{member.memberNumber}</span>
            <span>Membre depuis le {formatDateTime(member.joinedAt)}</span>
          </span>
        }
      />
      <div className="grid gap-8 xl:grid-cols-[3fr_2fr]">
        <MemberEditor key={member.id} member={member} />
        <section aria-labelledby="consents" className="h-fit rounded-2xl border border-border p-6">
          <h2 id="consents" className="mb-2 text-xl">
            Consentements
          </h2>
          <p className="mb-6 text-sm text-text-muted">Seul le membre peut les modifier, depuis son espace.</p>
          <DetailList
            items={[
              { label: 'Vœux d’anniversaire', value: consentText(member.consents.birthdayWishes) },
              { label: 'Nouvelles et calendrier', value: consentText(member.consents.newsletter) },
              { label: 'Diffusion de témoignages', value: consentText(member.consents.testimonialPublication) },
            ]}
          />
        </section>
      </div>
    </>
  );
}
