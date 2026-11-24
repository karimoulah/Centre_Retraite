import type { Metadata } from 'next';

import { PageHeader } from '@/components/backoffice/PageHeader';
import { CategoriesManager } from '@/features/finance/components/CategoriesManager';
import { getCategories } from '@/features/finance/queries';
import { requireRole } from '@/lib/session';

export const metadata: Metadata = { title: 'Catégories' };

export default async function CategoriesPage() {
  await requireRole('FINANCE');
  const [income, expense] = await Promise.all([
    getCategories({ direction: 'INCOME' }),
    getCategories({ direction: 'EXPENSE' }),
  ]);
  return (
    <>
      <PageHeader
        title="Catégories"
        description="Elles classent les recettes et les dépenses dans les écritures et les rapports. Une catégorie de recette ne sert jamais pour une dépense, et inversement."
      />
      <CategoriesManager income={income} expense={expense} />
    </>
  );
}
