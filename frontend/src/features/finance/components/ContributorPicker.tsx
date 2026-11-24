'use client';

import { useEffect, useId, useState, useTransition } from 'react';
import { Search, UserPlus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { Contributor } from '@/lib/api/contracts';

import { searchContributorsAction } from '../actions';
import { ContributorForm } from './ContributorForm';

type Picked = { id: string; name: string } | null;

/** Search by name or e-mail, pick one, or create a contributor without leaving the form. */
export function ContributorPicker({
  value,
  onChange,
}: {
  value: Picked;
  onChange: (contributor: Picked) => void;
}) {
  const id = useId();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Contributor[] | null>(null);
  const [pending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults(null);
      return;
    }
    const timer = setTimeout(
      () => startTransition(async () => setResults(await searchContributorsAction(q.trim()))),
      250,
    );
    return () => clearTimeout(timer);
  }, [q]);

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-base font-medium">
        Contributeur <span className="font-normal text-text-muted">(facultatif)</span>
      </legend>
      {value ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-900 p-3">
          <span className="font-medium">{value.name}</span>
          <Button type="button" variant="ghost" onClick={() => onChange(null)}>
            <X aria-hidden />
            Retirer
          </Button>
        </div>
      ) : (
        <>
          <label htmlFor={id} className="sr-only">
            Rechercher un contributeur
          </label>
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted"
            />
            <Input
              id={id}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nom ou courriel du donateur"
              className="pl-9"
              autoComplete="off"
              aria-describedby={`${id}-status`}
            />
          </div>
          <p id={`${id}-status`} aria-live="polite" className="text-sm text-text-muted">
            {pending
              ? 'Recherche…'
              : results
                ? results.length
                  ? `${results.length} résultat${results.length > 1 ? 's' : ''}`
                  : 'Aucun contributeur trouvé.'
                : 'Tapez au moins 2 lettres.'}
          </p>
          {results && results.length > 0 && (
            <ul className="flex flex-col gap-2" aria-label="Contributeurs trouvés">
              {results.map((c) => (
                <li key={c.id}>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto w-full justify-start py-2 text-left"
                    onClick={() => onChange({ id: c.id, name: c.name })}
                  >
                    <span>
                      <span className="block font-medium">{c.name}</span>
                      {c.email && <span className="block text-sm text-text-muted">{c.email}</span>}
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <Dialog open={creating} onOpenChange={setCreating}>
            <DialogTrigger asChild>
              <Button type="button" variant="ghost" className="w-fit">
                <UserPlus aria-hidden />
                Créer un contributeur
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl">Nouveau contributeur</DialogTitle>
                <DialogDescription>
                  Il sera choisi pour cette écriture ; complétez sa fiche plus tard si besoin.
                </DialogDescription>
              </DialogHeader>
              <ContributorForm
                compact
                onCreated={(c) => {
                  onChange({ id: c.id, name: c.name });
                  setCreating(false);
                }}
              />
            </DialogContent>
          </Dialog>
        </>
      )}
    </fieldset>
  );
}
