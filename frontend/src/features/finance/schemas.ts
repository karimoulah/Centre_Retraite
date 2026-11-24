import { CONTRIBUTOR_KINDS } from '@/lib/api/contracts';
import { fields, z } from '@/lib/zod';

export const categorySchema = z.object({
  name: fields.requiredText('Le nom', 80),
  receiptEligible: z.boolean(),
});
export type CategoryValues = z.infer<typeof categorySchema>;

const phone = z
  .string()
  .trim()
  .regex(/^[\d\s().+-]*$/, 'Entrez un numéro valide, par exemple 514 555-0100.')
  .max(30)
  .optional()
  .or(z.literal(''));

export const contributorSchema = z.object({
  kind: z.enum(CONTRIBUTOR_KINDS),
  name: fields.requiredText('Le nom', 160),
  email: z
    .string()
    .trim()
    .email('Entrez une adresse courriel valide.')
    .optional()
    .or(z.literal('')),
  phone,
  address: fields.optionalText(300),
  notes: fields.optionalText(2000),
});
export type ContributorValues = z.infer<typeof contributorSchema>;
