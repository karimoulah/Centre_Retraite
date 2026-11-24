import type { Metadata } from 'next';

import { PageHeader } from '@/components/backoffice/PageHeader';
import { ExpenseApprovalQueue } from '@/features/finance/components/ExpenseApprovalQueue';
import { getEntries, getFinanceSettings } from '@/features/finance/queries';
import { formatMoney } from '@/lib/format';
import { requireRole } from '@/lib/session';

export const metadata: Metadata = { title: 'Dépenses à approuver' };

export default async function ExpenseApprovalPage() {
  const user = await requireRole('FINANCE');
  const [submitted, settings] = await Promise.all([
    getEntries({
      direction: 'EXPENSE',
      status: 'SUBMITTED',
      pageSize: 100,
      sort: 'entryDate',
      order: 'asc',
    }),
    getFinanceSettings(),
  ]);
  return (
    <>
      <PageHeader
        title="Dépenses à approuver"
        description={`Dépenses de plus de ${formatMoney(settings.expenseApprovalThresholdCents)}. Une dépense est approuvée ou refusée par une autre personne que celle qui l’a saisie.`}
      />
      <ExpenseApprovalQueue expenses={submitted.items} currentUserId={user.id} />
    </>
  );
}
