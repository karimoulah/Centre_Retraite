'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ExternalLink } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { navFor } from '@/config/backoffice-nav';
import { siteConfig } from '@/config/site';
import type { Role } from '@/lib/api/contracts';

const isActive = (pathname: string, href: string) =>
  href === '/backoffice' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

/** Dark sidebar filtered by role; the active item is marked in lime. */
export function BackofficeSidebar({ roles }: { roles: Role[] }) {
  const pathname = usePathname();
  const groups = navFor(roles);

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="p-4">
        <Link href="/backoffice" className="flex min-h-11 items-center gap-2 rounded-full text-lg font-medium text-sidebar-foreground">
          <span aria-hidden className="bg-accent-400 inline-flex size-8 items-center justify-center rounded-full text-sm font-semibold text-brand-900">
            A
          </span>
          {siteConfig.name}
          <span className="sr-only"> — accueil du back-office</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label="Back-office">
          {groups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="text-text-on-dark-muted">{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const active = !item.external && isActive(pathname, item.href);
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          className="h-11 rounded-full px-4 text-[0.95rem] text-text-on-dark hover:bg-brand-800 hover:text-text-on-dark data-[active=true]:bg-accent-400 data-[active=true]:text-brand-900"
                        >
                          <Link
                            href={item.href}
                            aria-current={active ? 'page' : undefined}
                            {...(item.external ? { target: '_blank', rel: 'noopener' } : {})}
                          >
                            <item.icon aria-hidden />
                            <span>{item.label}</span>
                            {item.external && (
                              <>
                                <ExternalLink aria-hidden className="ml-auto size-3.5" />
                                <span className="sr-only"> (nouvel onglet)</span>
                              </>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </nav>
      </SidebarContent>
      <SidebarFooter className="p-4 text-sm text-text-on-dark-muted">{siteConfig.legalName}</SidebarFooter>
    </Sidebar>
  );
}
