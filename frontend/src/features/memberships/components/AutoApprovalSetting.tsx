'use client';

import { useId, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { FormErrorAlert } from '@/components/form/FormErrorAlert';
import { Switch } from '@/components/ui/switch';
import type { ActionResult } from '@/lib/actions';
import type { MembershipSettings } from '@/lib/api/contracts';
import { formatDateTime } from '@/lib/format';

import { updateMembershipSettingsAction } from '../actions';

/** Switch with an explanation of what changes; saved immediately. */
export function AutoApprovalSetting({ settings }: { settings: MembershipSettings }) {
  const id = useId();
  const [enabled, setEnabled] = useState(settings.autoApprove);
  const [error, setError] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  function change(value: boolean) {
    setEnabled(value);
    setError(null);
    startTransition(async () => {
      const result = await updateMembershipSettingsAction(value);
      if (result.ok) toast.success(result.message);
      else {
        setEnabled(!value);
        setError(result);
      }
    });
  }

  return (
    <section aria-labelledby={`${id}-title`} className="rounded-2xl border border-border p-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h2 id={`${id}-title`} className="text-xl">
            Approbation automatique des adhésions
          </h2>
          <p id={`${id}-help`} className="mt-2 max-w-2xl text-text-muted">
            Activée : chaque demande reçue sur le site devient immédiatement une fiche de membre et la personne reçoit
            son courriel de bienvenue. Désactivée : les demandes attendent la décision d’un administrateur.
          </p>
          {settings.updatedAt && (
            <p className="mt-3 text-sm text-text-muted">
              Dernière modification le {formatDateTime(settings.updatedAt)} par {settings.updatedBy}.
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Switch
            id={id}
            checked={enabled}
            onCheckedChange={change}
            disabled={pending}
            aria-describedby={`${id}-help`}
            aria-labelledby={`${id}-title`}
            className="h-7 w-12 data-[state=checked]:bg-brand-900 [&>span]:size-6"
          />
          <span aria-live="polite" className="w-20 font-medium">
            {enabled ? 'Activée' : 'Désactivée'}
          </span>
        </div>
      </div>
      <FormErrorAlert result={error} />
    </section>
  );
}
