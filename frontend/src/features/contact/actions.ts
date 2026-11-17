'use server';

import { runAction, type ActionResult } from '@/lib/actions';
import { api } from '@/lib/api/api';
import type { ContactRequest } from '@/lib/api/contracts';

import { contactSchema, type ContactValues } from './schemas';

export async function sendContactMessage(values: ContactValues, turnstileToken: string | null): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: 'Vérifiez les champs du formulaire.' };
  if (!turnstileToken) {
    return { ok: false, code: 'CAPTCHA_REQUIRED', message: 'Veuillez compléter la vérification anti-robot avant d’envoyer.' };
  }
  const result = await runAction(() =>
    api<undefined>('/contact', { method: 'POST', body: { ...parsed.data, turnstileToken } satisfies ContactRequest }).then(() => undefined),
  );
  if (!result.ok && result.status === 429) {
    return { ...result, message: 'Vous avez envoyé plusieurs messages en peu de temps. Patientez une minute, ou appelez-nous.' };
  }
  return result;
}

