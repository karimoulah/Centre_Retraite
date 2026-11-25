import { AGE_CATEGORIES, SEXES } from '@/lib/api/contracts';
import { fields, z } from '@/lib/zod';

const phone = z
  .string()
  .trim()
  .regex(/^[\d\s().+-]*$/, 'Entrez un numéro valide, par exemple 514 555-0100.')
  .max(30)
  .optional()
  .or(z.literal(''));

/** Required in the membership form and the member's profile; same rule as the API (10 digits at least). */
const requiredPhone = z
  .string()
  .trim()
  .min(1, { message: 'Le téléphone est obligatoire.', abort: true })
  .max(30)
  .regex(/^[\d\s().+-]+$/, { message: 'Entrez un numéro valide, par exemple 514 555-0100.', abort: true })
  .refine((v) => v.replace(/\D/g, '').length >= 10, 'Entrez un numéro valide, par exemple 514 555-0100.');

const requiredBirthDate = z
  .string()
  .min(1, { message: 'La date de naissance est obligatoire.', abort: true })
  .refine((value) => !Number.isNaN(Date.parse(value)) && value < new Date().toISOString().slice(0, 10), 'Entrez une date passée valide.');

const birthDate = z
  .string()
  .optional()
  .or(z.literal(''))
  .refine((value) => !value || (!Number.isNaN(Date.parse(value)) && value < new Date().toISOString().slice(0, 10)), 'Entrez une date passée valide.');

export const membershipSchema = z.object({
  firstName: fields.requiredText('Le prénom', 80),
  lastName: fields.requiredText('Le nom', 80),
  email: fields.email(),
  phone: requiredPhone,
  address: fields.requiredText('L’adresse postale', 300),
  sex: z.enum(SEXES, { message: 'Choisissez Masculin ou Féminin.' }),
  ageCategory: z.enum(AGE_CATEGORIES, { message: 'Choisissez votre catégorie d’âge.' }),
  birthDate: requiredBirthDate,
  birthdayWishesConsent: z.boolean(),
  newsletterConsent: z.boolean(),
});
export type MembershipValues = z.infer<typeof membershipSchema>;

/** Back-office: sex, phone, address and birth date stay optional, members registered before have none. */
export const memberSchema = membershipSchema
  .pick({ firstName: true, lastName: true, email: true, ageCategory: true })
  .extend({ sex: membershipSchema.shape.sex.optional(), phone, address: fields.optionalText(300), birthDate });
export type MemberValues = z.infer<typeof memberSchema>;

/** The member can change them but not erase them. */
export const myProfileSchema = z.object({ phone: requiredPhone, address: fields.requiredText('L’adresse postale', 300) });
export type MyProfileValues = z.infer<typeof myProfileSchema>;

export const rejectReasonSchema = z.string().trim().min(5, 'Le motif doit contenir au moins 5 caractères.').max(500);
