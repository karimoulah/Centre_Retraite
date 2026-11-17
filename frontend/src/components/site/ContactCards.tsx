import { Mail, MapPin, Phone } from 'lucide-react';

import type { SiteSetting } from '@/payload-types';

/** Phone, address and e-mail cards on a dark background (footer and contactCards block). */
export function ContactCards({ settings }: { settings: SiteSetting }) {
  const contacts = [
    { icon: Phone, label: 'Téléphone', value: settings.phone, href: `tel:${settings.phone?.replace(/[^\d+]/g, '')}`, external: false },
    {
      icon: MapPin,
      label: 'Adresse',
      value: settings.address,
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address ?? '')}`,
      external: true,
    },
    { icon: Mail, label: 'Courriel', value: settings.email, href: `mailto:${settings.email}`, external: false },
  ];
  return (
    <ul className="grid gap-4 md:grid-cols-3">
      {contacts.map(({ icon: Icon, label, value, href, external }) => (
        <li key={label}>
          <a
            href={href}
            {...(external ? { target: '_blank', rel: 'noopener' } : {})}
            className="flex h-full flex-col items-center gap-3 rounded-2xl border border-brand-800 px-6 py-10 text-center text-text-on-dark transition-colors hover:bg-brand-800"
          >
            <span className="bg-accent-400 flex size-12 items-center justify-center rounded-full text-brand-900">
              <Icon aria-hidden className="size-5" />
            </span>
            <span className="text-accent-400 text-lg font-medium">{label}</span>
            <span className="whitespace-pre-line text-text-on-dark-muted">
              {value}
              {external && <span className="sr-only"> (ouvre une carte dans un nouvel onglet)</span>}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
