'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { runAction, type ActionResult } from '@/lib/actions';
import { api } from '@/lib/api/api';
import type {
  AttachmentUpload,
  Category,
  Contributor,
  Entry,
  EntryDetail,
  EntryDirection,
  FinanceSettings,
  UpdateCategoryRequest,
} from '@/lib/api/contracts';
import { dollarsToCents } from '@/lib/format';
import { requireRole } from '@/lib/session';

import {
  categorySchema,
  contributorSchema,
  entrySchema,
  expenseSchema,
  thresholdSchema,
  toEntryRequest,
  type CategoryValues,
  type ContributorValues,
  type EntryValues,
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

/** New income (F5-04) or expense (F5-05): returns the entry so the form can send its receipt, then open it. */
export async function createEntryAction(
  direction: EntryDirection,
  values: EntryValues,
): Promise<ActionResult<Entry>> {
  await requireRole('FINANCE');
  const parsed = (direction === 'INCOME' ? entrySchema : expenseSchema).safeParse(values);
  if (!parsed.success) return invalid;
  const result = await runAction(
    () =>
      api<Entry>(direction === 'INCOME' ? '/entries' : '/expenses', {
        method: 'POST',
        body: toEntryRequest(parsed.data, direction),
      }),
    direction === 'INCOME' ? 'Recette enregistrée comme brouillon.' : 'Dépense enregistrée.',
  );
  if (result.ok) revalidatePath(`${FINANCE}/entries`);
  return result;
}

export async function updateEntryAction(
  id: string,
  direction: EntryDirection,
  values: EntryValues,
): Promise<ActionResult<Entry>> {
  await requireRole('FINANCE');
  const parsed = (direction === 'INCOME' ? entrySchema : expenseSchema).safeParse(values);
  if (!parsed.success) return invalid;
  const result = await runAction(
    () =>
      api<Entry>(`/entries/${id}`, {
        method: 'PATCH',
        body: toEntryRequest(parsed.data, direction),
      }),
    'Brouillon enregistré.',
  );
  if (result.ok) revalidatePath(`${FINANCE}/entries`, 'layout');
  return result;
}

/** Receipt, step 1: signed upload URL. The browser then PUTs the file itself (progress bar). */
export async function requestUploadAction(
  entryId: string,
  file: { fileName: string; contentType: string; size: number },
): Promise<ActionResult<AttachmentUpload>> {
  await requireRole('FINANCE');
  return runAction(() =>
    api<AttachmentUpload>(`/entries/${entryId}/attachment`, { method: 'POST', body: file }),
  );
}

/** Receipt, step 3: the API checks the stored file and attaches it. */
export async function confirmUploadAction(
  entryId: string,
  key: string,
  fileName: string,
): Promise<ActionResult<EntryDetail>> {
  await requireRole('FINANCE');
  const result = await runAction(
    () =>
      api<EntryDetail>(`/entries/${entryId}/attachment/confirm`, {
        method: 'POST',
        body: { key, fileName },
      }),
    'Pièce justificative jointe.',
  );
  if (result.ok) revalidatePath(`${FINANCE}/entries/${entryId}`);
  return result;
}

export async function removeAttachmentAction(entryId: string): Promise<ActionResult> {
  await requireRole('FINANCE');
  const result = await runAction(
    () => api<void>(`/entries/${entryId}/attachment`, { method: 'DELETE' }),
    'Pièce retirée.',
  );
  if (result.ok) revalidatePath(`${FINANCE}/entries/${entryId}`);
  return result;
}

/** Validation (F5-07): final, the entry then counts in the reports. */
export async function validateEntryAction(id: string): Promise<ActionResult<Entry>> {
  await requireRole('FINANCE');
  const result = await runAction(
    () => api<Entry>(`/entries/${id}/validate`, { method: 'POST' }),
    'Écriture validée.',
  );
  if (result.ok && result.data?.status === 'SUBMITTED')
    result.message =
      'Le seuil a changé : la dépense attend maintenant l’approbation d’une autre personne.';
  if (result.ok) revalidatePath(`${FINANCE}/entries`, 'layout');
  return result;
}

/** Reversal (F5-08): creates the opposite entry and opens it. */
export async function reverseEntryAction(
  id: string,
  reason?: string,
): Promise<ActionResult<Entry>> {
  await requireRole('FINANCE');
  if (!reason || reason.trim().length < 5)
    return { ok: false, message: 'Le motif doit contenir au moins 5 caractères.' };
  let reversal: Entry | undefined;
  const result = await runAction(async () => {
    reversal = await api<Entry>(`/entries/${id}/reverse`, {
      method: 'POST',
      body: { reason: reason.trim() },
    });
    return reversal;
  }, 'Contrepassation créée.');
  if (!result.ok) return result;
  revalidatePath(`${FINANCE}/entries`, 'layout');
  redirect(`${FINANCE}/entries/${reversal!.id}?reversed=1`);
}

export async function deleteDraftAction(id: string): Promise<ActionResult> {
  await requireRole('FINANCE');
  const result = await runAction(() => api<void>(`/entries/${id}`, { method: 'DELETE' }));
  if (!result.ok) return result;
  revalidatePath(`${FINANCE}/entries`);
  redirect(`${FINANCE}/entries`);
}

/** Expense approval (F5-09): by someone other than the author (the API refuses otherwise). */
export async function approveExpenseAction(id: string): Promise<ActionResult<Entry>> {
  await requireRole('FINANCE');
  const result = await runAction(
    () => api<Entry>(`/expenses/${id}/approve`, { method: 'POST' }),
    'Dépense approuvée : elle peut maintenant être validée.',
  );
  if (result.ok) revalidatePath(FINANCE, 'layout');
  return result;
}

export async function rejectExpenseAction(
  id: string,
  reason?: string,
): Promise<ActionResult<Entry>> {
  await requireRole('FINANCE');
  if (!reason || reason.trim().length < 5)
    return { ok: false, message: 'Le motif doit contenir au moins 5 caractères.' };
  const result = await runAction(
    () => api<Entry>(`/expenses/${id}/reject`, { method: 'POST', body: { reason: reason.trim() } }),
    'Dépense refusée.',
  );
  if (result.ok) revalidatePath(FINANCE, 'layout');
  return result;
}

/** Approval threshold (F5-10), administrators only. */
export async function updateFinanceSettingsAction(values: {
  threshold: string;
}): Promise<ActionResult<FinanceSettings>> {
  await requireRole('ADMIN');
  const parsed = thresholdSchema.safeParse(values);
  if (!parsed.success) return invalid;
  const result = await runAction(
    () =>
      api<FinanceSettings>('/settings/finance', {
        method: 'PUT',
        body: { expenseApprovalThresholdCents: dollarsToCents(parsed.data.threshold) },
      }),
    'Seuil d’approbation enregistré.',
  );
  if (result.ok) revalidatePath('/backoffice/settings');
  return result;
}
