import { AGE_CATEGORIES, SEXES } from '@/lib/api/contracts';
import { fields, z } from '@/lib/zod';

const phone = z
  .string()
  .trim()
  .regex(/^[\d\s().+-]*$/, 'Entrez un numéro valide, par exemple 514 555-0100.')
  .max(30)
  .optional()
  .or(z.literal(''));

const birthDate = z
  .string()
  .optional()
  .or(z.literal(''))
  .refine((value) => !value || (!Number.isNaN(Date.parse(value)) && value < new Date().toISOString().slice(0, 10)), 'Entrez une date passée valide.');

export const membershipSchema = z.object({
  firstName: fields.requiredText('Le prénom', 80),
  lastName: fields.requiredText('Le nom', 80),
  email: fields.email(),
  phone,
  address: fields.optionalText(300),
  sex: z.enum(SEXES, { message: 'Choisissez Masculin ou Féminin.' }),
  ageCategory: z.enum(AGE_CATEGORIES, { message: 'Choisissez votre catégorie d’âge.' }),
  birthDate,
  birthdayWishesConsent: z.boolean(),
  newsletterConsent: z.boolean(),
});
export type MembershipValues = z.infer<typeof membershipSchema>;

/** Back-office: the sex stays optional, members registered before the field have none. */
export const memberSchema = membershipSchema
  .pick({ firstName: true, lastName: true, email: true, phone: true, address: true, ageCategory: true, birthDate: true })
  .extend({ sex: membershipSchema.shape.sex.optional() });
export type MemberValues = z.infer<typeof memberSchema>;

export const myProfileSchema = z.object({ phone, address: fields.optionalText(300) });
export type MyProfileValues = z.infer<typeof myProfileSchema>;

export const rejectReasonSchema = z.string().trim().min(5, 'Le motif doit contenir au moins 5 caractères.').max(500);
