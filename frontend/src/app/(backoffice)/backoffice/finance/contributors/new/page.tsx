import type { Metadata } from 'next';

import { PageHeader } from '@/components/backoffice/PageHeader';
import { ContributorForm } from '@/features/finance/components/ContributorForm';
import { requireRole } from '@/lib/session';

export const metadata: Metadata = { title: 'Nouveau contributeur' };

export default async function NewContributorPage() {
  await requireRole('FINANCE');
  return (
    <>
      <PageHeader title="Nouveau contributeur" />
      <div className="max-w-3xl rounded-2xl border border-border p-6">
        <ContributorForm />
      </div>
    </>
  );
}
