import type { Metadata } from 'next';
import Link from 'next/link';
import { Minus, Plus } from 'lucide-react';

import { PageHeader } from '@/components/backoffice/PageHeader';
import { Button } from '@/components/ui/button';
import { EntriesTable } from '@/features/finance/components/EntriesTable';
import { EntryTotals } from '@/features/finance/components/EntryTotals';
import { getCategories, getEntries } from '@/features/finance/queries';
import type { EntriesQuery } from '@/lib/api/contracts';
import { parseListParams } from '@/lib/list-params';
import { requireRole } from '@/lib/session';

export const metadata: Metadata = { title: 'Écritures' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const FILTERS = [
  'from',
  'to',
  'categoryId',
  'contributorId',
  'direction',
  'status',
  'paymentMethod',
  'project',
] as const;

export default async function EntriesPage({ searchParams }: Props) {
  await requireRole('FINANCE');
  const query = parseListParams(await searchParams, {
    filters: FILTERS,
    defaults: { sort: 'entryDate', order: 'desc' },
  }) as EntriesQuery;
  const [data, categories] = await Promise.all([getEntries(query), getCategories()]);
  return (
    <>
      <PageHeader
        title="Écritures"
        description="Recettes et dépenses du Centre. Les totaux portent sur toute la sélection ; seules les écritures validées comptent dans les rapports."
        actions={
          <>
            <Button asChild variant="dark">
              <Link href="/backoffice/finance/entries/new">
                <Plus aria-hidden />
                Nouvelle recette
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/backoffice/finance/expenses/new">
                <Minus aria-hidden />
                Nouvelle dépense
              </Link>
            </Button>
          </>
        }
      />
      <EntryTotals totals={data.totals} />
      <EntriesTable data={data} categories={categories} sort={query.sort} order={query.order} />
    </>
  );
}
