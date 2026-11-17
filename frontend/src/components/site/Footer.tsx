import Link from 'next/link';
import { ExternalLink, Mail, MapPin, Phone } from 'lucide-react';

import { siteConfig } from '@/config/site';
import { getFooterMenus, getSiteSettings, resolveLink } from '@/lib/cms/payload';

import { Logo } from './Logo';

const platformLabels: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  x: 'X',
};

export async function Footer() {
  const [settings, menus] = await Promise.all([getSiteSettings(), getFooterMenus()]);
  const contacts = [
    { icon: Phone, label: 'Téléphone', value: settings.phone, href: `tel:${settings.phone?.replace(/[^\d+]/g, '')}` },
    { icon: MapPin, label: 'Adresse', value: settings.address, href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address ?? '')}` },
    { icon: Mail, label: 'Courriel', value: settings.email, href: `mailto:${settings.email}` },
  ];

  return (
    <footer className="bg-brand-900 text-text-on-dark">
      <div className="mx-auto max-w-site px-6 pt-16 pb-10 md:pt-24">
        <h2 className="sr-only">Nous joindre</h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {contacts.map(({ icon: Icon, label, value, href }) => (
            <li key={label}>
              <a
                href={href}
                {...(label === 'Adresse' ? { target: '_blank', rel: 'noopener' } : {})}
                className="flex h-full flex-col items-center gap-3 rounded-2xl border border-brand-800 px-6 py-10 text-center transition-colors hover:bg-brand-800"
              >
                <span className="bg-accent-400 flex size-12 items-center justify-center rounded-full text-brand-900">
                  <Icon aria-hidden className="size-5" />
                </span>
                <span className="text-accent-400 text-lg font-medium">{label}</span>
                <span className="whitespace-pre-line text-text-on-dark-muted">
                  {value}
                  {label === 'Adresse' && <span className="sr-only"> (ouvre une carte dans un nouvel onglet)</span>}
                </span>
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-16 grid gap-10 md:grid-cols-[2fr_3fr]">
          <div>
            <Logo />
            {settings.footerText && <p className="mt-4 max-w-sm text-text-on-dark-muted">{settings.footerText}</p>}
            {settings.openingHours && <p className="mt-3 text-text-on-dark-muted">{settings.openingHours}</p>}
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {(menus.columns ?? []).map((column) => (
              <nav key={column.id ?? column.title} aria-label={column.title}>
                <h3 className="text-base font-medium">{column.title}</h3>
                <ul className="mt-3 flex flex-col">
                  {(column.links ?? []).map((link) => (
                    <li key={link.id ?? link.label}>
                      <Link href={resolveLink(link)} className="inline-flex min-h-11 items-center text-text-on-dark-muted hover:text-text-on-dark hover:underline">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-brand-800 pt-6">
          <ul className="flex flex-wrap gap-2" aria-label="Réseaux sociaux">
            {(settings.socials ?? []).map((social) => (
              <li key={social.id ?? social.url}>
                <a
                  href={social.url}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-800 px-4 hover:bg-brand-800"
                >
                  {platformLabels[social.platform] ?? social.platform}
                  <ExternalLink aria-hidden className="size-3.5" />
                  <span className="sr-only"> (nouvel onglet)</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="text-sm text-text-on-dark-muted">
            © {new Date().getFullYear()} {siteConfig.legalName}. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
