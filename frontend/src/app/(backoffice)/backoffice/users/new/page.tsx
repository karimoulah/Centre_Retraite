import type { Metadata } from 'next';

import { PageHeader } from '@/components/backoffice/PageHeader';
import { CreateUserForm } from '@/features/users/components/CreateUserForm';
import { requireRole } from '@/lib/session';

export const metadata: Metadata = { title: 'Inviter un utilisateur' };

export default async function NewUserPage() {
  await requireRole('ADMIN');
  return (
    <>
      <PageHeader title="Inviter un utilisateur" description="La personne recevra un courriel pour choisir son mot de passe." />
      <CreateUserForm />
    </>
  );
}
