import 'server-only';

import { isRedirectError } from 'next/dist/client/components/redirect-error';

import { fieldErrors, isApiError, type FieldErrors } from '@/lib/api/errors';

/** What every Server Action returns to its form. */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; status?: number; code?: string; message: string; fieldErrors?: FieldErrors };

/**
 * Runs a Server Action body and turns API errors into a serializable result:
 * 422 → per-field errors, 409 → conflict message, 401 → session expired (the form keeps its data).
 */
export async function runAction<T>(
  body: () => Promise<T>,
  successMessage?: string,
): Promise<ActionResult<T>> {
  try {
    const data = await body();
    return { ok: true, data, message: successMessage };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (isApiError(error)) {
      if (error.status === 401) {
        return {
          ok: false,
          status: 401,
          code: 'SESSION_EXPIRED',
          message: 'Votre session a expiré. Reconnectez-vous dans un nouvel onglet, puis réessayez : vos saisies sont conservées.',
        };
      }
      return {
        ok: false,
        status: error.status,
        code: error.code,
        message: error.message,
        fieldErrors: error.status === 422 || error.status === 400 ? fieldErrors(error) : undefined,
      };
    }
    console.error(error);
    return { ok: false, message: 'Une erreur inattendue est survenue. Réessayez dans un instant.' };
  }
}
