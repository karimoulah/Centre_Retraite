'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type NavLink = { href: string; label: string; children?: { href: string; label: string }[] };

const pathOf = (href: string) => href.split('#')[0] || '/';

export const isCurrent = (pathname: string, href: string) => {
  const path = pathOf(href);
  return path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`);
};

/** A link, or one of its sub-links, matches the current page. */
export const isBranchCurrent = (pathname: string, link: NavLink) =>
  isCurrent(pathname, link.href) || (link.children ?? []).some((child) => isCurrent(pathname, child.href));

const itemClass = (current: boolean) =>
  cn(
    'flex min-h-11 items-center gap-2 rounded-full px-3.5 text-[0.9rem] whitespace-nowrap text-text-on-dark transition-colors hover:bg-white/10',
    current && 'bg-white/10',
  );

const Dot = () => <span aria-hidden className="bg-accent-400 size-1.5 rounded-full" />;

/** Translucent pill menu centred in the dark header; the current page has a lime dot. */
export function MainNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigation principale" className="hidden xl:block">
      <ul className="flex items-center gap-0.5 rounded-full border border-white/15 bg-white/10 p-1.5 backdrop-blur">
        {links.map((link) => {
          const current = isBranchCurrent(pathname, link);
          if (!link.children?.length) {
            return (
              <li key={`${link.href}-${link.label}`}>
                <Link href={link.href} aria-current={current ? 'page' : undefined} className={itemClass(current)}>
                  {current && <Dot />}
                  {link.label}
                </Link>
              </li>
            );
          }
          return (
            <li key={`${link.href}-${link.label}`}>
              <DropdownMenu>
                <DropdownMenuTrigger className={itemClass(current)}>
                  {current && <Dot />}
                  {link.label}
                  <ChevronDown aria-hidden className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-56 rounded-2xl p-2">
                  <DropdownMenuItem asChild className="min-h-11 rounded-xl text-base font-medium">
                    <Link href={link.href}>{link.label}</Link>
                  </DropdownMenuItem>
                  {link.children.map((child) => (
                    <DropdownMenuItem key={`${child.href}-${child.label}`} asChild className="min-h-11 rounded-xl text-base">
                      <Link href={child.href}>{child.label}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
