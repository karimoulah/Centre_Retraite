import type { Metadata } from 'next';

import { ConsentSwitches } from '@/features/account/components/ConsentSwitches';
import { getMyConsents } from '@/features/account/queries';

export const metadata: Metadata = { title: 'Mes consentements', robots: { index: false } };

export default async function ConsentsPage() {
  const consents = await getMyConsents();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl">Mes consentements</h2>
        <p className="mt-2 text-text-muted">Vous pouvez donner ou retirer votre accord à tout moment. Chaque changement est daté.</p>
      </div>
      <ConsentSwitches consents={consents} />
    </div>
  );
}
