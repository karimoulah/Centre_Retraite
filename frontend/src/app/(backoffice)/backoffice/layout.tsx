import type { ReactNode } from 'react';
import { cookies } from 'next/headers';

import { BackofficeSidebar } from '@/components/backoffice/BackofficeSidebar';
import { Breadcrumbs } from '@/components/backoffice/Breadcrumbs';
import { UserMenu } from '@/components/backoffice/UserMenu';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { logoutAction } from '@/features/auth/actions';
import { requireRole } from '@/lib/session';

const LOGOUT_FORM_ID = 'logout-form';

export default async function BackofficeShell({ children }: { children: ReactNode }) {
  const user = await requireRole('ADMIN', 'FINANCE', 'TESTIMONIALS');
  const sidebarOpen = (await cookies()).get('sidebar_state')?.value !== 'false';

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <BackofficeSidebar roles={user.roles} />
      <SidebarInset id="contenu" tabIndex={-1} className="outline-none">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur md:px-8">
          <SidebarTrigger className="size-11" />
          <Separator orientation="vertical" className="h-6" />
          <Breadcrumbs />
          <div className="ml-auto">
            <UserMenu user={user} logoutFormId={LOGOUT_FORM_ID} />
          </div>
        </header>
        <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">{children}</div>
      </SidebarInset>
      <form id={LOGOUT_FORM_ID} action={logoutAction} hidden />
    </SidebarProvider>
  );
}
