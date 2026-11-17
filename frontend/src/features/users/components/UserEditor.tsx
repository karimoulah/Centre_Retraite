'use client';

import { Controller } from 'react-hook-form';
import { UserX } from 'lucide-react';

import { ConfirmDialog } from '@/components/backoffice/ConfirmDialog';
import { FormErrorAlert, FormField, SubmitButton, useActionForm } from '@/components/form';
import { RoleCheckboxes } from '@/components/form/RoleCheckboxes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { UserAccount } from '@/lib/api/contracts';

import { deactivateUserAction, updateRolesAction, updateUserAction } from '../actions';
import { rolesSchema, updateUserSchema, type RolesValues, type UpdateUserValues } from '../schemas';

export function UserEditor({ user, isSelf }: { user: UserAccount; isSelf: boolean }) {
  const identity = useActionForm<UpdateUserValues>({
    schema: updateUserSchema,
    action: (values) => updateUserAction(user.id, values),
    defaultValues: { firstName: user.firstName, lastName: user.lastName },
  });
  const roles = useActionForm<RolesValues>({
    schema: rolesSchema,
    action: (values) => updateRolesAction(user.id, values),
    defaultValues: { roles: user.roles },
  });

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section aria-labelledby="identity" className="rounded-2xl border border-border p-6">
        <h2 id="identity" className="mb-6 text-xl">
          Identité
        </h2>
        <form onSubmit={identity.onSubmit} noValidate className="flex flex-col gap-6">
          <FormErrorAlert result={identity.formError} />
          <FormField control={identity.form.control} name="firstName" label="Prénom" required>
            {(props) => <Input {...props} value={String(props.value)} />}
          </FormField>
          <FormField control={identity.form.control} name="lastName" label="Nom" required>
            {(props) => <Input {...props} value={String(props.value)} />}
          </FormField>
          <p className="text-text-muted">
            Courriel : <span className="font-medium text-text">{user.email}</span>
          </p>
          <div>
            <SubmitButton pending={identity.form.formState.isSubmitting} disabled={!user.active}>
              Enregistrer
            </SubmitButton>
          </div>
        </form>
      </section>

      <section aria-labelledby="roles" className="rounded-2xl border border-border p-6">
        <h2 id="roles" className="mb-6 text-xl">
          Rôles
        </h2>
        <form onSubmit={roles.onSubmit} noValidate className="flex flex-col gap-6">
          <FormErrorAlert result={roles.formError} />
          <Controller
            control={roles.form.control}
            name="roles"
            render={({ field, fieldState }) => (
              <RoleCheckboxes
                legend="Rôles du compte"
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
                disabledRoles={isSelf ? ['ADMIN'] : []}
              />
            )}
          />
          {isSelf && <p className="text-sm text-text-muted">Vous ne pouvez pas retirer votre propre rôle Administration.</p>}
          <div>
            <SubmitButton pending={roles.form.formState.isSubmitting} disabled={!user.active}>
              Enregistrer les rôles
            </SubmitButton>
          </div>
        </form>
      </section>

      {user.active && !isSelf && (
        <section aria-labelledby="danger" className="rounded-2xl border border-status-error/30 p-6 lg:col-span-2">
          <h2 id="danger" className="text-xl">
            Désactiver le compte
          </h2>
          <p className="mt-2 text-text-muted">La personne ne pourra plus se connecter. Son historique est conservé.</p>
          <ConfirmDialog
            trigger={
              <Button variant="destructive" className="mt-4">
                <UserX aria-hidden />
                Désactiver le compte
              </Button>
            }
            title={`Désactiver le compte de ${user.firstName} ${user.lastName} ?`}
            consequence="La personne sera déconnectée et ne pourra plus se connecter. Cette action est inscrite au journal d'audit."
            confirmLabel="Désactiver"
            tone="destructive"
            onConfirm={() => deactivateUserAction(user.id)}
          />
        </section>
      )}
    </div>
  );
}
