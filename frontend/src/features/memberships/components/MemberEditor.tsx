'use client';

import { Controller } from 'react-hook-form';
import { UserX } from 'lucide-react';

import { ConfirmDialog } from '@/components/backoffice/ConfirmDialog';
import { FormErrorAlert, FormField, SubmitButton, useActionForm } from '@/components/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Member } from '@/lib/api/contracts';

import { deactivateMemberAction, updateMemberAction } from '../actions';
import { memberSchema, type MemberValues } from '../schemas';
import { AgeCategoryField } from './AgeCategoryField';
import { SexField } from './SexField';

export function MemberEditor({ member }: { member: Member }) {
  const { form, onSubmit, formError } = useActionForm<MemberValues>({
    schema: memberSchema,
    action: (values) => updateMemberAction(member.id, values),
    defaultValues: {
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone ?? '',
      address: member.address ?? '',
      sex: member.sex ?? undefined,
      ageCategory: member.ageCategory,
      birthDate: member.birthDate ?? '',
    },
  });

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6 rounded-2xl border border-border p-6" aria-labelledby="member-form-title">
        <h2 id="member-form-title" className="text-xl">
          Fiche du membre
        </h2>
        <FormErrorAlert result={formError} />
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField control={form.control} name="firstName" label="Prénom" required>
            {(props) => <Input {...props} value={String(props.value)} />}
          </FormField>
          <FormField control={form.control} name="lastName" label="Nom" required>
            {(props) => <Input {...props} value={String(props.value)} />}
          </FormField>
          <FormField control={form.control} name="email" label="Adresse courriel" required>
            {(props) => <Input {...props} value={String(props.value)} type="email" />}
          </FormField>
          <FormField control={form.control} name="phone" label="Téléphone">
            {(props) => <Input {...props} value={String(props.value)} type="tel" />}
          </FormField>
        </div>
        <FormField control={form.control} name="address" label="Adresse postale">
          {(props) => <Textarea {...props} value={String(props.value)} rows={3} className="min-h-20" />}
        </FormField>
        <Controller control={form.control} name="sex" render={({ field, fieldState }) => <SexField value={field.value} onChange={field.onChange} error={fieldState.error?.message} />} />
        <Controller control={form.control} name="ageCategory" render={({ field, fieldState }) => <AgeCategoryField value={field.value} onChange={field.onChange} error={fieldState.error?.message} />} />
        <FormField control={form.control} name="birthDate" label="Date de naissance" description="Utilisée seulement pour les vœux d’anniversaire, si le membre y consent.">
          {(props) => <Input {...props} value={String(props.value)} type="date" className="w-full sm:w-64" />}
        </FormField>
        <div>
          <SubmitButton pending={form.formState.isSubmitting} disabled={!member.active}>
            Enregistrer la fiche
          </SubmitButton>
        </div>
      </form>

      {member.active && (
        <section aria-labelledby="deactivate-member" className="rounded-2xl border border-status-error/30 p-6">
          <h2 id="deactivate-member" className="text-xl">
            Désactiver le membre
          </h2>
          <p className="mt-2 text-text-muted">Le membre ne recevra plus de communications ; son historique (dons, activités) est conservé.</p>
          <ConfirmDialog
            trigger={
              <Button variant="destructive" className="mt-4">
                <UserX aria-hidden />
                Désactiver le membre
              </Button>
            }
            title={`Désactiver ${member.firstName} ${member.lastName} ?`}
            consequence="Le membre ne recevra plus les vœux ni les nouvelles, et son espace membre sera fermé. Cette action est inscrite au journal."
            confirmLabel="Désactiver"
            tone="destructive"
            onConfirm={() => deactivateMemberAction(member.id)}
          />
        </section>
      )}
    </div>
  );
}
