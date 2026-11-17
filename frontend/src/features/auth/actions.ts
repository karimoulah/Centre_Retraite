'use server';

import { redirect } from 'next/navigation';

import { runAction, type ActionResult } from '@/lib/actions';
import { api } from '@/lib/api/api';
import type { LoginResponse } from '@/lib/api/contracts';
import { isApiError } from '@/lib/api/errors';
import { homeFor, safeNext } from '@/lib/session';

import { loginSchema, type LoginValues } from './schemas';

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
