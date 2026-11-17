'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

export type NavLink = { href: string; label: string };

export const isCurrent = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

/** Translucent pill menu centred in the dark header; the current page has a lime dot. */
export function MainNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigation principale" className="hidden lg:block">
      <ul className="flex items-center gap-1 rounded-full border border-white/15 bg-white/10 p-1.5 backdrop-blur">
        {links.map((link) => {
          const current = isCurrent(pathname, link.href);
          return (
            <li key={`${link.href}-${link.label}`}>
              <Link
                href={link.href}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center gap-2 rounded-full px-4 text-[0.95rem] text-text-on-dark transition-colors hover:bg-white/10',
                  current && 'bg-white/10',
                )}
              >
                {current && <span aria-hidden className="bg-accent-400 size-1.5 rounded-full" />}
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
