'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, UserRound } from 'lucide-react';

import { cn } from '@/lib/utils';

const links = [
  { href: '/account/profile', label: 'Mon profil', icon: UserRound },
  { href: '/account/consents', label: 'Mes consentements', icon: ShieldCheck },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Espace membre">
      <ul className="flex flex-col gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const current = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={current ? 'page' : undefined}
                className={cn('flex min-h-12 items-center gap-3 rounded-full px-4 hover:bg-surface-muted', current && 'bg-accent-200 font-medium text-brand-900 hover:bg-accent-200')}
              >
                <Icon aria-hidden className="size-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
