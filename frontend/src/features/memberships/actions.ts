'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { runAction, type ActionResult } from '@/lib/actions';
import { api } from '@/lib/api/api';
import type { Member, MembershipApplication, MembershipRequest, MembershipSettings } from '@/lib/api/contracts';
import { requireRole } from '@/lib/session';

import { memberSchema, membershipSchema, rejectReasonSchema, type MemberValues, type MembershipValues } from './schemas';

const invalid = { ok: false as const, message: 'Vérifiez les champs du formulaire.' };

/** Public application (F4-01). */
export async function applyForMembershipAction(values: MembershipValues, turnstileToken: string | null): Promise<ActionResult> {
  const parsed = membershipSchema.safeParse(values);
  if (!parsed.success) return invalid;
  if (!turnstileToken) return { ok: false, code: 'CAPTCHA_REQUIRED', message: 'Veuillez compléter la vérification anti-robot.' };
  let status: MembershipRequest['status'] = 'PENDING';
  const result = await runAction(async () => {
    const body: MembershipApplication = { ...parsed.data, birthDate: parsed.data.birthDate || null, turnstileToken };
    const response = await api<{ id: string; status: MembershipRequest['status'] }>('/memberships', { method: 'POST', body, redirectOnUnauthorized: false });
    status = response.status;
  });
  if (!result.ok) return result;
  redirect(`/membership/confirmation?status=${status}`);
}

/** Back-office decisions (F4-04). */
export async function approveMembershipAction(id: string): Promise<ActionResult> {
  await requireRole('ADMIN');
  const result = await runAction(async () => {
    await api<MembershipRequest>(`/memberships/${id}/approve`, { method: 'POST' });
  }, 'Demande approuvée : la fiche de membre est créée.');
  revalidatePath('/backoffice/memberships', 'layout');
  return result;
}

export async function rejectMembershipAction(id: string, reason?: string): Promise<ActionResult> {
  await requireRole('ADMIN');
  const parsed = rejectReasonSchema.safeParse(reason ?? '');
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Motif invalide.' };
  const result = await runAction(async () => {
    await api<MembershipRequest>(`/memberships/${id}/reject`, { method: 'POST', body: { reason: parsed.data } });
  }, 'Demande refusée.');
  revalidatePath('/backoffice/memberships', 'layout');
  return result;
}

/** Auto-approval setting (F4-05). */
export async function updateMembershipSettingsAction(autoApprove: boolean): Promise<ActionResult> {
  await requireRole('ADMIN');
  const result = await runAction(async () => {
    await api<MembershipSettings>('/settings/membership', { method: 'PUT', body: { autoApprove } });
  }, autoApprove ? 'Approbation automatique activée.' : 'Approbation automatique désactivée.');
  revalidatePath('/backoffice/settings');
  return result;
}

/** Members (F4-06). */
export async function updateMemberAction(id: string, values: MemberValues): Promise<ActionResult> {
  await requireRole('ADMIN');
  const parsed = memberSchema.safeParse(values);
  if (!parsed.success) return invalid;
  const result = await runAction(async () => {
    await api<Member>(`/members/${id}`, {
      method: 'PATCH',
      body: { ...parsed.data, phone: parsed.data.phone || null, address: parsed.data.address || null, birthDate: parsed.data.birthDate || null },
    });
  }, 'Fiche du membre enregistrée.');
  revalidatePath(`/backoffice/members/${id}`);
  return result;
}

export async function deactivateMemberAction(id: string): Promise<ActionResult> {
  await requireRole('ADMIN');
  const result = await runAction(async () => {
    await api<Member>(`/members/${id}/deactivate`, { method: 'POST' });
  }, 'Membre désactivé.');
  revalidatePath(`/backoffice/members/${id}`);
  revalidatePath('/backoffice/members');
  return result;
}
