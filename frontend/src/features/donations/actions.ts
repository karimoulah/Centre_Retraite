'use server';

import { runAction, type ActionResult } from '@/lib/actions';
import { api } from '@/lib/api/api';
import type { DonationCheckout } from '@/lib/api/contracts';

import { donationCents, donationSchema, type DonationValues } from './schemas';

/** F6-01: returns the payment page URL; the browser goes there (card data never reaches the Centre). */
export async function startDonationAction(
  values: DonationValues,
  turnstileToken: string | null,
): Promise<ActionResult<DonationCheckout>> {
  const parsed = donationSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: 'Vérifiez les champs du formulaire.' };
  if (!turnstileToken)
    return {
      ok: false,
      code: 'CAPTCHA_REQUIRED',
      message: 'Veuillez compléter la vérification anti-robot.',
    };
  const result = await runAction(() =>
    api<DonationCheckout>('/donations/checkout', {
      method: 'POST',
      body: {
        amountCents: donationCents(parsed.data),
        donorName: parsed.data.donorName,
        donorEmail: parsed.data.donorEmail,
        turnstileToken,
      },
      redirectOnUnauthorized: false,
    }),
  );
  if (!result.ok && result.status === 429)
    return {
      ...result,
      message: 'Plusieurs tentatives en peu de temps. Patientez une minute, puis réessayez.',
    };
  if (!result.ok && result.fieldErrors?.amountCents)
    return { ...result, fieldErrors: { otherAmount: result.fieldErrors.amountCents } };
  return result;
}
