import type { Metadata } from 'next';

import { PageHeader } from '@/components/backoffice/PageHeader';
import { EntryForm } from '@/features/finance/components/EntryForm';
import { getCategories, getFinanceSettings } from '@/features/finance/queries';
import { requireRole } from '@/lib/session';

export const metadata: Metadata = { title: 'Nouvelle dépense' };

export default async function NewExpensePage() {
  await requireRole('FINANCE');
  const [categories, settings] = await Promise.all([
    getCategories({ direction: 'EXPENSE', active: 'true' }),
    getFinanceSettings(),
  ]);
  return (
    <>
      <PageHeader
        title="Nouvelle dépense"
        description="Joignez la facture : elle est exigée pour valider la dépense."
      />
      <div className="max-w-3xl rounded-2xl border border-border p-6">
        <EntryForm
          direction="EXPENSE"
          categories={categories}
          thresholdCents={settings.expenseApprovalThresholdCents}
        />
      </div>
    </>
  );
}
