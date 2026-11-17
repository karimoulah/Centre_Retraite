import type { Metadata } from 'next';
import Link from 'next/link';

import { FormAlert } from '@/components/form';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';

export const metadata: Metadata = { title: 'Nouveau mot de passe' };

type Props = { searchParams: Promise<{ token?: string }> };

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;
  return (
    <>
      <h1 className="text-4xl">Nouveau mot de passe</h1>
      <p className="mt-3 mb-8 text-text-muted">Choisissez un mot de passe que vous n’utilisez pas ailleurs.</p>
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <FormAlert title="Lien incomplet">
          Ouvrez le lien reçu par courriel, ou{' '}
          <Link href="/forgot-password" className="font-medium underline">
            demandez-en un nouveau
          </Link>
          .
        </FormAlert>
      )}
    </>
  );
}
