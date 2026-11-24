import { createZodDto } from 'nestjs-zod';

import { z } from '../../common/zod';
import { AGE_CATEGORIES } from '../../database/entities';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => value || null);

export const membershipApplicationSchema = z.object({
  firstName: z.string().trim().min(1, 'Le prénom est obligatoire.').max(80),
  lastName: z.string().trim().min(1, 'Le nom est obligatoire.').max(80),
  email: z.email().trim().toLowerCase(),
  phone: optionalText(30),
  address: optionalText(300),
  ageCategory: z.enum(AGE_CATEGORIES),
  /** Optional, only used for birthday wishes. */
  birthDate: z.iso
    .date()
    .optional()
    .nullable()
    .transform((value) => value || null)
    .refine((value) => !value || new Date(value) < new Date(), 'La date de naissance doit être dans le passé.'),
  birthdayWishesConsent: z.boolean().default(false),
  newsletterConsent: z.boolean().default(false),
  turnstileToken: z.string().min(1, 'La vérification anti-robot est obligatoire.').max(2048),
});
export class MembershipApplicationDto extends createZodDto(membershipApplicationSchema) {}
