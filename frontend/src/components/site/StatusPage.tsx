import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';

type StatusPageProps = {
  code?: string;
  title: string;
  message: string;
  action?: { href: string; label: string };
  children?: React.ReactNode;
};

/** Full-height message used by the 404, 403 and error pages, in the site's dark style. */
export function StatusPage({ code, title, message, action, children }: StatusPageProps) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl rounded-2xl bg-brand-900 px-8 py-14 text-center text-text-on-dark md:px-14">
        {code && (
          <p className="text-accent-400 text-lg font-medium" aria-hidden>
            {code}
          </p>
        )}
        <h1 className="mt-2 text-4xl md:text-5xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-xl text-text-on-dark-muted">{message}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {children}
          <Button asChild variant="accent">
            <Link href={action?.href ?? '/'}>
              <ArrowLeft aria-hidden />
              {action?.label ?? "Retour à l'accueil"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
