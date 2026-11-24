import type { Metadata } from 'next';

import { PageHeader } from '@/components/backoffice/PageHeader';
import { ThresholdSetting } from '@/features/finance/components/ThresholdSetting';
import { getFinanceSettings } from '@/features/finance/queries';
import { AutoApprovalSetting } from '@/features/memberships/components/AutoApprovalSetting';
import { getMembershipSettings } from '@/features/memberships/queries';
import { requireRole } from '@/lib/session';

export const metadata: Metadata = { title: 'Paramètres' };

export default async function SettingsPage() {
  await requireRole('ADMIN');
  const [membership, finance] = await Promise.all([getMembershipSettings(), getFinanceSettings()]);
  return (
    <>
      <PageHeader title="Paramètres" description="Réglages du fonctionnement de la plateforme. Chaque changement est inscrit au journal d’audit." />
      <div className="flex flex-col gap-6">
        <AutoApprovalSetting settings={membership} />
        <ThresholdSetting settings={finance} />
      </div>
    </>
  );
}
