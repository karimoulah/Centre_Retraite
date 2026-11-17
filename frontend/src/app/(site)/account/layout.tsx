import type { ReactNode } from 'react';

import { AccountNav } from '@/features/account/components/AccountNav';
import { LogoutButton } from '@/features/auth/components/LogoutButton';
import { requireRole } from '@/lib/session';

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const user = await requireRole('MEMBER');
  return (
    <>
      <div className="bg-brand-900 text-text-on-dark">
        <div className="mx-auto max-w-site px-6 pt-10 pb-16">
          <p className="text-text-on-dark-muted">Espace membre</p>
          <h1 className="mt-2 text-[2.25rem] md:text-[3rem]">Bonjour {user.firstName}</h1>
        </div>
      </div>
      <div className="mx-auto grid max-w-site gap-10 px-6 py-12 md:grid-cols-[16rem_1fr] md:py-16">
        <aside className="flex flex-col gap-4">
          <AccountNav />
          <LogoutButton variant="ghost" />
        </aside>
        <div>{children}</div>
      </div>
    </>
  );
}
