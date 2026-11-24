import { dollarsToCents } from '@/lib/format';
import { fields, z } from '@/lib/zod';

/** Preset (cents as text) or "other" with a free amount in dollars; 5 $ minimum. */
export const donationSchema = z
  .object({
    preset: z.string().min(1, 'Choisissez un montant.'),
    otherAmount: z.string().trim().optional(),
    donorName: fields.requiredText('Votre nom', 160),
    donorEmail: fields.email(),
  })
  .superRefine((v, ctx) => {
    if (v.preset !== 'other') return;
    const cents = v.otherAmount ? dollarsToCents(v.otherAmount) : null;
    if (
      !v.otherAmount ||
      cents === null ||
      !/^\d+([.,]\d{1,2})?$/.test(v.otherAmount.replace(/\s/g, ''))
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['otherAmount'],
        message: 'Entrez un montant en dollars, par exemple 40.',
      });
    } else if (cents < 500) {
      ctx.addIssue({
        code: 'custom',
        path: ['otherAmount'],
        message: 'Le don minimum est de 5 $.',
      });
    } else if (cents > 1_000_000) {
      ctx.addIssue({
        code: 'custom',
        path: ['otherAmount'],
        message: 'Pour un don de plus de 10 000 $, communiquez avec le Centre.',
      });
    }
  });
export type DonationValues = z.infer<typeof donationSchema>;

export const donationCents = (v: DonationValues) =>
  v.preset === 'other' ? dollarsToCents(v.otherAmount ?? '')! : Number(v.preset);
