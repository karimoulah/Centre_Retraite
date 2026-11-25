import type { Metadata } from 'next';

import { DetailList } from '@/components/backoffice/DetailList';
import { FormAlert } from '@/components/form';
import { ProfileForm } from '@/features/account/components/ProfileForm';
import { getMyProfile } from '@/features/account/queries';
import { AGE_CATEGORY_LABELS, SEX_LABELS } from '@/lib/api/contracts';
import { isApiError } from '@/lib/api/errors';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Mon profil', robots: { index: false } };

export default async function ProfilePage() {
  const member = await getMyProfile().catch((error) => {
    if (isApiError(error) && error.status === 404) return null;
    throw error;
  });
  if (!member) {
    return <FormAlert tone="info">Votre compte n’est pas encore relié à une fiche de membre. Communiquez avec le Centre.</FormAlert>;
  }
  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="identite" className="rounded-2xl bg-surface-muted p-6">
        <h2 id="identite" className="mb-2 text-2xl">
          Mon adhésion
        </h2>
        <p className="mb-6 text-text-muted">Pour corriger ces renseignements, communiquez avec le Centre.</p>
        <DetailList
          items={[
            { label: 'Nom', value: `${member.firstName} ${member.lastName}` },
            { label: 'Numéro de membre', value: member.memberNumber },
            { label: 'Courriel', value: member.email },
            { label: 'Sexe', value: member.sex ? SEX_LABELS[member.sex] : null },
            { label: 'Catégorie d’âge', value: AGE_CATEGORY_LABELS[member.ageCategory] },
            { label: 'Membre depuis', value: formatDate(member.joinedAt) },
          ]}
        />
      </section>
      <ProfileForm member={member} />
    </div>
  );
}
