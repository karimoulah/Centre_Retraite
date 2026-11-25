import { createZodDto } from 'nestjs-zod';

import { z } from '../../common/zod';
import { listQuerySchema } from '../../common/pagination';
import { AGE_CATEGORIES, MEMBERSHIP_STATUSES, SEXES } from '../../database/entities';

/** One message per field (abort). Digits, spaces and ( ) . + - ; at least 10 digits (a North American number). */
export const requiredPhone = z
  .string()
  .trim()
  .min(1, { message: 'Le téléphone est obligatoire.', abort: true })
  .max(30)
  .regex(/^[\d\s().+-]+$/, { message: 'Entrez un numéro valide, par exemple 514 555-0100.', abort: true })
  .refine((v) => v.replace(/\D/g, '').length >= 10, 'Entrez un numéro valide, par exemple 514 555-0100.');

export const membershipApplicationSchema = z.object({
  firstName: z.string().trim().min(1, 'Le prénom est obligatoire.').max(80),
  lastName: z.string().trim().min(1, 'Le nom est obligatoire.').max(80),
  email: z.email().trim().toLowerCase(),
  phone: requiredPhone,
  address: z.string().trim().min(1, 'L’adresse postale est obligatoire.').max(300),
  sex: z.enum(SEXES, { message: 'Choisissez Masculin ou Féminin.' }),
  ageCategory: z.enum(AGE_CATEGORIES),
  birthDate: z.iso
    .date({ message: 'La date de naissance est obligatoire.', abort: true })
    .refine((value) => new Date(value) < new Date(), 'La date de naissance doit être dans le passé.'),
  birthdayWishesConsent: z.boolean().default(false),
  newsletterConsent: z.boolean().default(false),
  turnstileToken: z.string().min(1, 'La vérification anti-robot est obligatoire.').max(2048),
});
export class MembershipApplicationDto extends createZodDto(membershipApplicationSchema) {}

export class ListMembershipsQuery extends createZodDto(
  listQuerySchema.extend({ status: z.enum(MEMBERSHIP_STATUSES).optional() }),
) {}

export class DecisionDto extends createZodDto(
  z.object({ createAccount: z.boolean().default(true) }).optional().transform((body) => body ?? { createAccount: true }),
) {}
export class RejectDto extends createZodDto(
  z.object({ reason: z.string().trim().min(5, 'Le motif est obligatoire (5 caractères minimum).').max(1000) }),
) {}
