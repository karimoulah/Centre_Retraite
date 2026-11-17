import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { FormAlert } from '@/components/form';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { getSession, homeFor, safeNext } from '@/lib/session';

export const metadata: Metadata = { title: 'Connexion' };

type Props = { searchParams: Promise<{ next?: string; reason?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { next, reason } = await searchParams;
  const user = await getSession();
  if (user) redirect(safeNext(next) ?? homeFor(user));

  return (
    <>
      <h1 className="text-4xl">Connexion</h1>
      <p className="mt-3 text-text-muted">Entrez l&apos;adresse courriel et le mot de passe de votre compte.</p>
      <div className="mt-8 flex flex-col gap-6">
        {reason === 'expired' && (
          <FormAlert tone="info" title="Session expirée">
            Pour votre sécurité, vous avez été déconnecté. Reconnectez-vous pour continuer.
          </FormAlert>
        )}
        {reason === 'reset' && (
          <FormAlert tone="success">Votre mot de passe a été modifié. Vous pouvez vous connecter.</FormAlert>
        )}
        {reason === 'logout' && (
          <FormAlert tone="success">Vous êtes déconnecté.</FormAlert>
        )}
        <LoginForm next={safeNext(next) ?? undefined} />
      </div>
    </>
  );
}
