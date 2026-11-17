'use client';

import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

import { StatusPage } from '@/components/site/StatusPage';
import { Button } from '@/components/ui/button';

type ErrorViewProps = {
  error: Error & { digest?: string };
  reset: () => void;
  homeHref?: string;
};

/** Shared body of every error.tsx: French message, retry button, link back. */
export function ErrorView({ error, reset, homeHref = '/' }: ErrorViewProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      title="Une erreur est survenue"
      message="Nous n'avons pas pu afficher cette page. Réessayez dans un instant ; si le problème continue, communiquez avec le Centre."
      action={{ href: homeHref, label: homeHref === '/' ? "Retour à l'accueil" : 'Retour' }}
    >
      <Button variant="outlineOnDark" onClick={reset}>
        <RotateCcw aria-hidden />
        Réessayer
      </Button>
      {error.digest && <span className="sr-only">Code de l&apos;erreur : {error.digest}</span>}
    </StatusPage>
  );
}
