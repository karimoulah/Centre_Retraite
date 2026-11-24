import { createZodDto } from 'nestjs-zod';

import { z } from '../../common/zod';

export const MIN_DONATION_CENTS = 500;

export class CheckoutDto extends createZodDto(
  z.object({
    amountCents: z
      .number({ message: 'Indiquez un montant.' })
      .int('Le montant doit être en cents.')
      .min(MIN_DONATION_CENTS, 'Le don minimum est de 5 $.')
      .max(1_000_000, 'Pour un don de plus de 10 000 $, communiquez avec le Centre.'),
    donorName: z.string().trim().min(1, 'Indiquez votre nom.').max(160),
    donorEmail: z.email().trim().toLowerCase(),
    turnstileToken: z.string().min(1, 'La vérification anti-robot est obligatoire.').max(2048),
  }),
) {}
