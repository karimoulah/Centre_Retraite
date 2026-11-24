import type { Metadata } from 'next';
import Link from 'next/link';

import { DetailList } from '@/components/backoffice/DetailList';
import { PageHeader } from '@/components/backoffice/PageHeader';
import { ContributorForm } from '@/features/finance/components/ContributorForm';
import { getContributor } from '@/features/finance/queries';
import { CONTRIBUTOR_KIND_LABELS } from '@/lib/api/contracts';
import { formatDate } from '@/lib/format';
import { requireRole } from '@/lib/session';

export const metadata: Metadata = { title: 'Contributeur' };

type Props = { params: Promise<{ id: string }> };

export default async function ContributorPage({ params }: Props) {
  await requireRole('FINANCE');
  const contributor = await getContributor((await params).id);
  return (
    <>
      <PageHeader
        title={contributor.name}
        description={`${CONTRIBUTOR_KIND_LABELS[contributor.kind]} · contributeur depuis le ${formatDate(contributor.createdAt)}`}
      />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section
          aria-labelledby="contributor-form"
          className="rounded-2xl border border-border p-6"
        >
          <h2 id="contributor-form" className="mb-6 text-xl">
            Fiche du contributeur
          </h2>
          <ContributorForm contributor={contributor} />
        </section>
        <section
          aria-labelledby="contributor-member"
          className="h-fit rounded-2xl border border-border p-6"
        >
          <h2 id="contributor-member" className="mb-4 text-xl">
            Lien avec un membre
          </h2>
          <DetailList
            items={[
              {
                label: 'Membre',
                value: contributor.member ? (
                  <Link
                    href={`/backoffice/members/${contributor.member.id}`}
                    className="underline underline-offset-4"
                  >
                    {contributor.member.name} ({contributor.member.memberNumber})
                  </Link>
                ) : null,
              },
            ]}
          />
        </section>
      </div>
    </>
  );
}
