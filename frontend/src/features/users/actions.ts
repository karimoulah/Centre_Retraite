'use server';

import { revalidatePath } from 'next/cache';

import { runAction, type ActionResult } from '@/lib/actions';
import { api } from '@/lib/api/api';
import type { UserAccount } from '@/lib/api/contracts';
import { requireRole } from '@/lib/session';

import {
  createUserSchema,
  rolesSchema,
  updateUserSchema,
  type CreateUserValues,
  type RolesValues,
  type UpdateUserValues,
} from './schemas';

const invalid: ActionResult<never> = { ok: false, message: 'Vérifiez les champs du formulaire.' };

export async function createUserAction(
  values: CreateUserValues,
): Promise<ActionResult<{ id: string }>> {
  await requireRole('ADMIN');
  const parsed = createUserSchema.safeParse(values);
  if (!parsed.success) return invalid;
  const result = await runAction(async () => {
    const user = await api<UserAccount>('/users', { method: 'POST', body: parsed.data });
    return { id: user.id };
  }, `Invitation envoyée à ${parsed.data.email}.`);
  if (result.ok) {
    revalidatePath('/backoffice/users');
  }
  return result;
}

export async function updateUserAction(
  id: string,
  values: UpdateUserValues,
): Promise<ActionResult> {
  await requireRole('ADMIN');
  const parsed = updateUserSchema.safeParse(values);
  if (!parsed.success) return invalid;
  const result = await runAction(async () => {
    await api(`/users/${id}`, { method: 'PATCH', body: parsed.data });
  }, 'Fiche mise à jour.');
  if (result.ok) {
    revalidatePath(`/backoffice/users/${id}`);
  }
  return result;
}

export async function updateRolesAction(id: string, values: RolesValues): Promise<ActionResult> {
  await requireRole('ADMIN');
  const parsed = rolesSchema.safeParse(values);
  if (!parsed.success) return invalid;
  const result = await runAction(async () => {
    await api(`/users/${id}/roles`, { method: 'PUT', body: parsed.data });
  }, 'Rôles mis à jour.');
  if (result.ok) {
    revalidatePath(`/backoffice/users/${id}`);
  }
  return result;
}

export async function deactivateUserAction(id: string): Promise<ActionResult> {
  await requireRole('ADMIN');
  const result = await runAction(async () => {
    await api(`/users/${id}/deactivate`, { method: 'POST' });
  }, 'Compte désactivé.');
  if (result.ok) {
    revalidatePath(`/backoffice/users/${id}`);
    revalidatePath('/backoffice/users');
  }
  return result;
}
