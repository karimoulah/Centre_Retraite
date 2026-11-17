import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowRight, ArrowUpRight, Phone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Guide de style',
  robots: { index: false, follow: false },
};

const colors = [
  { token: '--brand-900', hex: '#03292C', use: 'Fonds sombres, boutons sombres' },
  { token: '--brand-800', hex: '#0A3A3D', use: 'Survol et bordures sur fond sombre' },
  { token: '--accent-400', hex: '#E5FC62', use: "Boutons d'action, pastilles (jamais en texte sur blanc)" },
  { token: '--accent-200', hex: '#ECFC82', use: 'Élément sélectionné, fonds doux' },
  { token: '--surface', hex: '#FFFFFF', use: 'Fond de page' },
  { token: '--surface-muted', hex: '#F5F5F5', use: 'Cartes grises' },
  { token: '--border', hex: '#E5ECEC', use: 'Séparateurs, bordures' },
  { token: '--text', hex: '#0B1F21', use: 'Texte principal' },
  { token: '--text-muted', hex: '#656C67', use: 'Texte secondaire (assombri pour le contraste AA)' },
  { token: '--text-on-dark-muted', hex: '#A9B8B6', use: 'Texte secondaire sur fond sombre' },
];

const statuses = [
  { label: 'Validée', className: 'bg-status-success' },
  { label: 'En attente', className: 'bg-status-warning' },
  { label: 'Refusée', className: 'bg-status-error' },
  { label: 'Information', className: 'bg-status-info' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border py-12">
      <h2 className="mb-8 text-3xl">{title}</h2>
      {children}
    </section>
  );
}

// Development-only page that shows the design tokens and base components.
export default function StyleguidePage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <div className="mx-auto max-w-site px-6 py-16">
      <h1 className="text-4xl md:text-[3.25rem]">Guide de style</h1>
      <p className="mt-4 max-w-2xl text-text-muted">
        Couleurs, typographie et composants de base tirés de la maquette. Page visible en
        développement seulement.
      </p>

      <Section title="Couleurs">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {colors.map((color) => (
            <li key={color.token} className="flex items-center gap-4">
              <span
                aria-hidden
                className="size-16 shrink-0 rounded-2xl border border-border"
                style={{ background: `var(${color.token})` }}
              />
              <span>
                <code className="block font-medium">{color.token}</code>
                <span className="block text-text-muted">
                  {color.hex} · {color.use}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <h3 className="mt-10 mb-4 text-xl">Statuts du back-office</h3>
        <ul className="flex flex-wrap gap-3">
          {statuses.map((status) => (
            <li
              key={status.label}
              className={`rounded-full px-3 py-1 text-sm font-medium text-white ${status.className}`}
            >
              {status.label}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Typographie">
        <div className="space-y-6">
          <p className="text-4xl md:text-[3.25rem]">Titre H1 — Vos parents sourient.</p>
          <p className="text-[1.75rem] font-medium tracking-tight md:text-[2.375rem]">
            Titre H2 — Là où les inconnus deviennent une famille
          </p>
          <p className="text-xl font-medium">Titre H3 — Accompagnement personnalisé</p>
          <p className="max-w-2xl">
            Texte de base 18 px, interlignage 1,6. Le Centre accompagne les personnes retraitées
            et leurs proches au quotidien : activités, entraide et écoute.
          </p>
          <p className="text-text-muted">Texte secondaire, légendes et sous-titres.</p>
        </div>
      </Section>

      <Section title="Boutons">
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="accent">
            Devenir membre <ArrowUpRight aria-hidden />
          </Button>
          <Button variant="dark">
            Faire un don <ArrowRight aria-hidden />
          </Button>
          <Button variant="ghost">Annuler</Button>
          <Button variant="outline">Secondaire</Button>
          <Button variant="destructive">Refuser</Button>
          <Button variant="link">Lien dans le texte</Button>
          <Button variant="dark" disabled>
            Désactivé
          </Button>
          <Button variant="outline" size="icon" aria-label="Voir le service">
            <ArrowUpRight aria-hidden />
          </Button>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-4 rounded-2xl bg-brand-900 p-8">
          <Button variant="accent">
            <Phone aria-hidden /> (514) 555-0100
          </Button>
          <Button variant="outlineOnDark">Sur fond sombre</Button>
          <Button variant="ghostOnDark">Fantôme sur fond sombre</Button>
          <Button variant="outlineOnDark" size="icon" aria-label="Ouvrir">
            <ArrowUpRight aria-hidden />
          </Button>
        </div>
      </Section>

      <Section title="Cartes">
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <span className="text-text-muted">01</span>
              <CardTitle>Soutien aux aînés</CardTitle>
              <CardDescription>Accompagnement et réconfort au quotidien.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-brand-900 text-text-on-dark">
            <CardHeader>
              <CardTitle className="text-5xl">25+</CardTitle>
              <CardDescription className="text-text-on-dark-muted">
                Années d&apos;existence
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-accent-200">
            <CardContent>
              <p className="font-medium text-brand-900">Élément sélectionné</p>
            </CardContent>
          </Card>
        </div>
      </Section>
    </div>
  );
}
