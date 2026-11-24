import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';

import { PageHeader } from '@/components/backoffice/PageHeader';
import { Button } from '@/components/ui/button';
import { ContributorsTable } from '@/features/finance/components/ContributorsTable';
import { getContributors } from '@/features/finance/queries';
import { parseListParams } from '@/lib/list-params';
import { requireRole } from '@/lib/session';

export const metadata: Metadata = { title: 'Contributeurs' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ContributorsPage({ searchParams }: Props) {
  await requireRole('FINANCE');
  const query = parseListParams(await searchParams, {
    filters: ['kind'],
    defaults: { sort: 'name', order: 'asc' },
  });
  const data = await getContributors(query);
  return (
    <>
      <PageHeader
        title="Contributeurs"
        description="Personnes et organismes qui versent de l’argent au Centre. Un don en ligne retrouve ou crée le contributeur par son courriel."
        actions={
          <Button asChild variant="dark">
            <Link href="/backoffice/finance/contributors/new">
              <Plus aria-hidden />
              Nouveau contributeur
            </Link>
          </Button>
        }
      />
      <ContributorsTable data={data} sort={query.sort} order={query.order} />
    </>
  );
}
