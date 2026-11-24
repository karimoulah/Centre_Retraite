'use server';

import { revalidatePath } from 'next/cache';

import { runAction, type ActionResult } from '@/lib/actions';
import { api } from '@/lib/api/api';
import type {
  Category,
  Contributor,
  EntryDirection,
  UpdateCategoryRequest,
} from '@/lib/api/contracts';
import { requireRole } from '@/lib/session';

import {
  categorySchema,
  contributorSchema,
  type CategoryValues,
  type ContributorValues,
} from './schemas';

const invalid = { ok: false as const, message: 'Vérifiez les champs du formulaire.' };
const FINANCE = '/backoffice/finance';

/** Categories (F5-01). */
export async function createCategoryAction(
  direction: EntryDirection,
  values: CategoryValues,
): Promise<ActionResult<Category>> {
  await requireRole('FINANCE');
  const parsed = categorySchema.safeParse(values);
  if (!parsed.success) return invalid;
  const result = await runAction(
    () =>
      api<Category>('/categories', {
        method: 'POST',
        body: {
          ...parsed.data,
          direction,
          receiptEligible: direction === 'INCOME' && parsed.data.receiptEligible,
        },
      }),
    'Catégorie créée.',
  );
  if (result.ok) revalidatePath(`${FINANCE}/categories`);
  return result;
}

export async function updateCategoryAction(
  id: string,
  body: UpdateCategoryRequest,
  message: string,
): Promise<ActionResult<Category>> {
  await requireRole('FINANCE');
  const result = await runAction(
    () => api<Category>(`/categories/${id}`, { method: 'PATCH', body }),
    message,
  );
  if (result.ok) revalidatePath(`${FINANCE}/categories`);
  return result;
}

const contributorBody = (values: ContributorValues) => ({
  kind: values.kind,
  name: values.name,
  email: values.email || null,
  phone: values.phone || null,
  address: values.address || null,
  notes: values.notes || null,
});

/** Contributors (F5-01). Returns the record so the entry form can pick a contributor it just created. */
export async function createContributorAction(
  values: ContributorValues,
): Promise<ActionResult<Contributor>> {
  await requireRole('FINANCE');
  const parsed = contributorSchema.safeParse(values);
  if (!parsed.success) return invalid;
  const result = await runAction(
    () => api<Contributor>('/contributors', { method: 'POST', body: contributorBody(parsed.data) }),
    'Contributeur créé.',
  );
  if (result.ok) revalidatePath(`${FINANCE}/contributors`);
  return result;
}

export async function updateContributorAction(
  id: string,
  values: ContributorValues,
): Promise<ActionResult<Contributor>> {
  await requireRole('FINANCE');
  const parsed = contributorSchema.safeParse(values);
  if (!parsed.success) return invalid;
  const result = await runAction(
    () =>
      api<Contributor>(`/contributors/${id}`, {
        method: 'PATCH',
        body: contributorBody(parsed.data),
      }),
    'Fiche du contributeur enregistrée.',
  );
  if (result.ok) revalidatePath(`${FINANCE}/contributors`, 'layout');
  return result;
}

/** Search used by the contributor picker of the entry form. */
export async function searchContributorsAction(q: string): Promise<Contributor[]> {
  await requireRole('FINANCE');
  const page = await api<{ items: Contributor[] }>('/contributors', { query: { q, pageSize: 8 } });
  return page.items;
}
