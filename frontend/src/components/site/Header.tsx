import { Phone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getMainMenu, getSiteSettings, resolveLink } from '@/lib/cms/payload';

import { Logo } from './Logo';
import { MainNav } from './MainNav';
import { MobileNav } from './MobileNav';

export async function Header() {
  const [menu, settings] = await Promise.all([getMainMenu(), getSiteSettings()]);
  const links = (menu.items ?? []).map((item) => ({
    href: resolveLink(item),
    label: item.label,
    children: (item.children ?? []).map((child) => ({ href: resolveLink(child), label: child.label })),
  }));
  const phone = settings.phone;

  return (
    <header className="bg-brand-900 text-text-on-dark">
      <div className="mx-auto flex max-w-[1376px] items-center justify-between gap-3 px-6 py-5 2xl:gap-4">
        <Logo />
        <MainNav links={links} />
        <div className="flex shrink-0 items-center gap-2">
          {phone && (
            <Button asChild variant="accent">
              <a href={`tel:${phone.replace(/[^\d+]/g, '')}`}>
                <Phone aria-hidden />
                <span className="sr-only sm:not-sr-only xl:sr-only">{phone}</span>
                <span className="sr-only">Appeler le Centre</span>
              </a>
            </Button>
          )}
          <MobileNav links={links} phone={phone} />
        </div>
      </div>
    </header>
  );
}
