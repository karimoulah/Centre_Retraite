import type { Metadata } from 'next';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';

import { ContactForm } from '@/features/contact/components/ContactForm';
import { getSiteSettings } from '@/lib/cms/payload';

export const metadata: Metadata = {
  title: 'Nous joindre',
  description: "Écrivez ou téléphonez au Centre d'accompagnement des retraités.",
};

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const details = [
    { icon: Phone, label: 'Téléphone', value: settings.phone, href: `tel:${settings.phone?.replace(/[^\d+]/g, '')}` },
    { icon: Mail, label: 'Courriel', value: settings.email, href: `mailto:${settings.email}` },
    { icon: MapPin, label: 'Adresse', value: settings.address },
    { icon: Clock, label: 'Heures d’ouverture', value: settings.openingHours },
  ].filter((item) => item.value);

  return (
    <>
      <div className="bg-brand-900 text-text-on-dark">
        <div className="mx-auto max-w-site px-6 pt-10 pb-16">
          <h1 className="text-[2.25rem] md:text-[3.25rem]">Nous joindre</h1>
          <p className="mt-4 max-w-2xl text-text-on-dark-muted">
            Une question sur nos activités, l’adhésion ou le bénévolat ? Écrivez-nous ou appelez-nous : nous répondons à
            chaque message.
          </p>
        </div>
      </div>
      <div className="mx-auto grid max-w-site gap-12 px-6 py-16 md:py-24 lg:grid-cols-[2fr_3fr]">
        <aside aria-labelledby="coordonnees">
          <h2 id="coordonnees" className="text-2xl">
            Coordonnées
          </h2>
          <ul className="mt-6 flex flex-col gap-5">
            {details.map(({ icon: Icon, label, value, href }) => (
              <li key={label} className="flex gap-4">
                <span className="bg-accent-400 flex size-11 shrink-0 items-center justify-center rounded-full text-brand-900">
                  <Icon aria-hidden className="size-5" />
                </span>
                <span>
                  <span className="block font-medium">{label}</span>
                  {href ? (
                    <a href={href} className="inline-flex min-h-11 items-center underline underline-offset-4 hover:no-underline">
                      {value}
                    </a>
                  ) : (
                    <span className="block whitespace-pre-line text-text-muted">{value}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </aside>
        <section aria-labelledby="ecrire">
          <h2 id="ecrire" className="mb-6 text-2xl">
            Écrire au Centre
          </h2>
          <ContactForm />
        </section>
      </div>
    </>
  );
}
