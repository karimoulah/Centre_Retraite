'use client';

import { useId } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { ROLE_LABELS, ROLES, type Role } from '@/lib/api/contracts';

const descriptions: Record<Role, string> = {
  ADMIN: 'Comptes, adhésions, membres, paramètres et contenu du site.',
  FINANCE: 'Écritures, dons, rapports et reçus.',
  TESTIMONIALS: 'Modération des témoignages.',
  MEMBER: 'Espace membre : profil et consentements.',
};

type Props = {
  value: Role[];
  onChange: (roles: Role[]) => void;
  error?: string;
  disabledRoles?: Role[];
  legend?: string;
};

/** Role picker as labelled checkboxes, with what each role gives access to. */
export function RoleCheckboxes({ value, onChange, error, disabledRoles = [], legend = 'Rôles' }: Props) {
  const id = useId();
  return (
    <fieldset aria-describedby={error ? `${id}-error` : undefined} aria-invalid={!!error}>
      <legend className="mb-3 text-base font-medium">
        {legend} <span className="text-status-error" aria-hidden>*</span>
      </legend>
      <div className="flex flex-col gap-2">
        {ROLES.map((role) => {
          const checked = value.includes(role);
          return (
            <label key={role} htmlFor={`${id}-${role}`} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-border p-3 has-[:checked]:border-brand-900 has-[:checked]:bg-surface-muted">
              <Checkbox
                id={`${id}-${role}`}
                checked={checked}
                disabled={disabledRoles.includes(role)}
                onCheckedChange={(next) => onChange(next ? [...value, role] : value.filter((r) => r !== role))}
                className="mt-0.5 size-5"
              />
              <span>
                <span className="block font-medium">{ROLE_LABELS[role]}</span>
                <span className="block text-sm text-text-muted">{descriptions[role]}</span>
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm font-medium text-status-error">
          {error}
        </p>
      )}
    </fieldset>
  );
}
