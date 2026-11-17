'use client';

import { useId, useState, useTransition } from 'react';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { FormErrorAlert } from '@/components/form/FormErrorAlert';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { ActionResult } from '@/lib/actions';
import type { Member, MemberConsentKey } from '@/lib/api/contracts';
import { formatDate } from '@/lib/format';

import { updateConsentAction } from '../actions';

const items: { key: MemberConsentKey; title: string; description: string }[] = [
  { key: 'birthdayWishes', title: 'Vœux d’anniversaire', description: 'Le Centre vous envoie un courriel le jour de votre anniversaire.' },
  { key: 'newsletter', title: 'Nouvelles et calendrier', description: 'Environ une fois par mois : activités à venir et nouvelles du Centre.' },
  {
    key: 'testimonialPublication',
    title: 'Diffusion de mes témoignages',
    description: 'Vos témoignages approuvés peuvent être publiés sur le site du Centre.',
  },
];

function ConsentRow({ item, value }: { item: (typeof items)[number]; value: Member['consents'][MemberConsentKey] }) {
  const id = useId();
  const [granted, setGranted] = useState(value.granted);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  function save(next: boolean) {
    setGranted(next);
    setError(null);
    startTransition(async () => {
      const result = await updateConsentAction(item.key, next);
      if (result.ok) toast.success(result.message);
      else {
        setGranted(!next);
        setError(result);
      }
    });
  }

  function onChange(next: boolean) {
    // Withdrawing publication removes published testimonials: warn first.
    if (!next && item.key === 'testimonialPublication') setConfirmOpen(true);
    else save(next);
  }

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border p-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h2 id={`${id}-title`} className="text-xl">
            {item.title}
          </h2>
          <p id={`${id}-desc`} className="mt-1 text-text-muted">
            {item.description}
          </p>
          <p className="mt-2 text-sm text-text-muted" aria-live="polite">
            {granted ? (value.granted && value.updatedAt ? `Accord donné le ${formatDate(value.updatedAt)}.` : 'Accord donné.') : 'Pas d’accord donné.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            checked={granted}
            onCheckedChange={onChange}
            disabled={pending}
            aria-labelledby={`${id}-title`}
            aria-describedby={`${id}-desc`}
            className="h-7 w-12 data-[state=checked]:bg-brand-900 [&>span]:size-6"
          />
          <span className="w-10 font-medium">{granted ? 'Oui' : 'Non'}</span>
        </div>
      </div>
      <FormErrorAlert result={error} />
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-2xl">
              <AlertTriangle aria-hidden className="size-6 text-status-warning" />
              Retirer votre accord de diffusion ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-text">
              Vos témoignages déjà publiés seront retirés du site du Centre dans les 48 heures. Vous pourrez redonner
              votre accord plus tard, mais il faudra les soumettre à nouveau.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel asChild>
              <Button variant="ghost">Garder mon accord</Button>
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmOpen(false);
                save(false);
              }}
            >
              Retirer mon accord
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}

export function ConsentSwitches({ consents }: { consents: Member['consents'] }) {
  return (
    <ul className="flex flex-col gap-4">
      {items.map((item) => (
        <ConsentRow key={item.key} item={item} value={consents[item.key]} />
      ))}
    </ul>
  );
}
