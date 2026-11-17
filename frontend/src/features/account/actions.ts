'use server';

import { revalidatePath } from 'next/cache';

import { myProfileSchema, type MyProfileValues } from '@/features/memberships/schemas';
import { runAction, type ActionResult } from '@/lib/actions';
import { api } from '@/lib/api/api';
import type { Member, MemberConsentKey } from '@/lib/api/contracts';
import { requireRole } from '@/lib/session';

export async function updateMyProfileAction(values: MyProfileValues): Promise<ActionResult> {
  await requireRole('MEMBER');
  const parsed = myProfileSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: 'Vérifiez les champs du formulaire.' };
  const result = await runAction(async () => {
    await api<Member>('/me/profile', { method: 'PATCH', body: { phone: parsed.data.phone || null, address: parsed.data.address || null } });
  }, 'Vos coordonnées sont enregistrées.');
  if (result.ok) revalidatePath('/account/profile');
  return result;
}

export async function updateConsentAction(key: MemberConsentKey, granted: boolean): Promise<ActionResult> {
  await requireRole('MEMBER');
  const result = await runAction(async () => {
    await api<Member['consents']>('/me/consents', { method: 'PUT', body: { [key]: granted } });
  }, granted ? 'Votre accord est enregistré.' : 'Votre retrait est enregistré.');
  if (result.ok) revalidatePath('/account/consents');
  return result;
}
