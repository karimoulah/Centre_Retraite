import type { Metadata } from 'next';

import { PageHeader } from '@/components/backoffice/PageHeader';
import { EntryForm } from '@/features/finance/components/EntryForm';
import { getCategories } from '@/features/finance/queries';
import { requireRole } from '@/lib/session';

export const metadata: Metadata = { title: 'Nouvelle recette' };

export default async function NewIncomePage() {
  await requireRole('FINANCE');
  const categories = await getCategories({ direction: 'INCOME', active: 'true' });
  return (
    <>
      <PageHeader
        title="Nouvelle recette"
        description="Elle est enregistrée comme brouillon : elle comptera dans les rapports une fois validée."
      />
      <div className="max-w-3xl rounded-2xl border border-border p-6">
        <EntryForm direction="INCOME" categories={categories} />
      </div>
    </>
  );
}
