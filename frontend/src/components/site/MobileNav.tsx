'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Phone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

import { isCurrent, type NavLink } from './MainNav';

/** Collapsible menu for small screens. */
export function MobileNav({ links, phone }: { links: NavLink[]; phone?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outlineOnDark" size="icon" className="lg:hidden" aria-label="Ouvrir le menu">
          <Menu aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(22rem,100vw)] border-brand-800 bg-brand-900 text-text-on-dark">
        <SheetHeader>
          <SheetTitle className="text-text-on-dark">Menu</SheetTitle>
          <SheetDescription className="sr-only">Navigation principale du site</SheetDescription>
        </SheetHeader>
        <nav aria-label="Navigation principale (mobile)" className="px-4">
          <ul className="flex flex-col gap-1">
            {links.map((link) => {
              const current = isCurrent(pathname, link.href);
              return (
                <li key={`${link.href}-${link.label}`}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={current ? 'page' : undefined}
                    className={cn('flex min-h-12 items-center gap-3 rounded-full px-4 text-lg hover:bg-brand-800', current && 'bg-brand-800')}
                  >
                    {current && <span aria-hidden className="bg-accent-400 size-2 rounded-full" />}
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          {phone && (
            <Button asChild variant="accent" size="lg" className="mt-6 w-full">
              <a href={`tel:${phone.replace(/[^\d+]/g, '')}`}>
                <Phone aria-hidden />
                {phone}
              </a>
            </Button>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
