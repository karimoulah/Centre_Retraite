import type { Metadata } from 'next';

import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';

export const metadata: Metadata = { title: 'Mot de passe oublié' };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-4xl">Mot de passe oublié</h1>
      <p className="mt-3 mb-8 text-text-muted">Entrez votre adresse courriel : nous vous enverrons un lien pour en choisir un nouveau.</p>
      <ForgotPasswordForm />
    </>
  );
}
