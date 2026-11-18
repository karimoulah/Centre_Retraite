'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Phone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

import { isBranchCurrent, isCurrent, type NavLink } from './MainNav';

/** Collapsible menu for small screens. */
export function MobileNav({ links, phone }: { links: NavLink[]; phone?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outlineOnDark" size="icon" className="xl:hidden" aria-label="Ouvrir le menu">
          <Menu aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(22rem,100vw)] overflow-y-auto border-brand-800 bg-brand-900 text-text-on-dark">
        <SheetHeader>
          <SheetTitle className="text-text-on-dark">Menu</SheetTitle>
          <SheetDescription className="sr-only">Navigation principale du site</SheetDescription>
        </SheetHeader>
        <nav aria-label="Navigation principale (mobile)" className="px-4">
          <ul className="flex flex-col gap-1">
            {links.map((link) => {
              const current = isBranchCurrent(pathname, link);
              return (
                <li key={`${link.href}-${link.label}`}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={isCurrent(pathname, link.href) ? 'page' : undefined}
                    className={cn('flex min-h-12 items-center gap-3 rounded-full px-4 text-lg hover:bg-brand-800', current && 'bg-brand-800')}
                  >
                    {current && <span aria-hidden className="bg-accent-400 size-2 rounded-full" />}
                    {link.label}
                  </Link>
                  {link.children && link.children.length > 0 && (
                    <ul className="mb-2 ml-6 flex flex-col border-l border-brand-800 pl-2">
                      {link.children.map((child) => (
                        <li key={`${child.href}-${child.label}`}>
                          <Link
                            href={child.href}
                            onClick={() => setOpen(false)}
                            className="flex min-h-11 items-center rounded-full px-4 text-text-on-dark-muted hover:bg-brand-800 hover:text-text-on-dark"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
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
