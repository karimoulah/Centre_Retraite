'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { runAction, type ActionResult } from '@/lib/actions';
import { api } from '@/lib/api/api';
import type { LoginResponse } from '@/lib/api/contracts';
import { isApiError } from '@/lib/api/errors';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth/config';
import { homeFor, safeNext } from '@/lib/session';

import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  type ForgotPasswordValues,
  type LoginValues,
  type ResetPasswordValues,
} from './schemas';

const loginMessages: Record<number, string> = {
  // Same message whether the e-mail exists or not.
  401: 'Courriel ou mot de passe incorrect.',
  423: 'Votre compte est temporairement bloqué après plusieurs tentatives. Réessayez dans 15 minutes ou choisissez « Mot de passe oublié ».',
  429: 'Trop de tentatives de connexion. Patientez une minute avant de réessayer.',
};

export async function loginAction(values: LoginValues, next?: string): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: 'Vérifiez les champs du formulaire.' };

  let destination = '/';
  try {
    const { user } = await api<LoginResponse>('/auth/login', {
      method: 'POST',
      body: parsed.data,
      forwardSetCookies: true,
    });
    destination = safeNext(next) ?? homeFor(user);
  } catch (error) {
    if (isApiError(error) && loginMessages[error.status]) {
      return { ok: false, status: error.status, code: error.code, message: loginMessages[error.status] };
    }
    return runAction(() => Promise.reject(error));
  }
  redirect(destination);
}

/** Ends the session on the API, clears the cookies and goes back to the home page. */
export async function logoutAction(): Promise<void> {
  try {
    await api('/auth/logout', { method: 'POST', forwardSetCookies: true, redirectOnUnauthorized: false });
  } catch {
    // The session is cleared locally below even if the API is unreachable.
  }
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
  redirect('/');
}

/** Always answers the same way, whether the address has an account or not. */
export async function forgotPasswordAction(values: ForgotPasswordValues): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: 'Vérifiez le champ courriel.' };
  try {
    await api('/auth/password/forgot', { method: 'POST', body: parsed.data, redirectOnUnauthorized: false });
  } catch (error) {
    if (isApiError(error) && error.status === 429) {
      return { ok: false, status: 429, message: 'Trop de demandes. Patientez quelques minutes avant de réessayer.' };
    }
    // Any other error stays silent so the answer never reveals whether an account exists.
  }
  return { ok: true };
}

export async function resetPasswordAction(token: string, values: ResetPasswordValues): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: 'Vérifiez les champs du formulaire.' };
  try {
    await api('/auth/password/reset', { method: 'POST', body: { token, password: parsed.data.password }, redirectOnUnauthorized: false });
  } catch (error) {
    if (isApiError(error) && (error.status === 410 || error.status === 400 || error.status === 404)) {
      return { ok: false, status: error.status, code: 'TOKEN_EXPIRED', message: 'Ce lien a expiré ou a déjà été utilisé.' };
    }
    return runAction(() => Promise.reject(error));
  }
  redirect('/login?reason=reset');
}
