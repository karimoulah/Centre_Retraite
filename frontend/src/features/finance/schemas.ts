import {
  CONTRIBUTOR_KINDS,
  MANUAL_PAYMENT_METHODS,
  type EntryDirection,
  type EntryRequest,
} from '@/lib/api/contracts';
import { dollarsToCents } from '@/lib/format';
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

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });

/** Amount typed in dollars ("12,50"), sent in cents. */
export const entrySchema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, 'Entrez le montant.')
    .refine((v) => {
      const cents = dollarsToCents(v);
      return (
        cents !== null &&
        cents > 0 &&
        cents <= 100_000_000 &&
        /^\d+([.,]\d{1,2})?$/.test(v.replace(/\s/g, ''))
      );
    }, 'Entrez un montant en dollars, par exemple 125,50.'),
  entryDate: z
    .string()
    .min(1, 'Entrez la date.')
    .refine((d) => d <= today(), 'La date ne peut pas être dans le futur.'),
  categoryId: z.string().min(1, 'Choisissez une catégorie.'),
  paymentMethod: z.enum(MANUAL_PAYMENT_METHODS, { message: 'Choisissez un mode de paiement.' }),
  description: fields.requiredText('La description', 500),
  project: fields.optionalText(120),
  contributorId: z.string().optional(),
  supplier: fields.optionalText(160),
});
export type EntryValues = z.infer<typeof entrySchema>;

export const expenseSchema = entrySchema.extend({
  supplier: fields.requiredText('Le fournisseur', 160),
});

export const toEntryRequest = (values: EntryValues, direction: EntryDirection): EntryRequest => ({
  amountCents: dollarsToCents(values.amount)!,
  entryDate: values.entryDate,
  categoryId: values.categoryId,
  paymentMethod: values.paymentMethod,
  description: values.description,
  project: values.project || null,
  ...(direction === 'INCOME'
    ? { contributorId: values.contributorId || null }
    : { supplier: values.supplier }),
});

export const centsToInput = (cents: number) => (cents / 100).toFixed(2).replace('.', ',');
export { today as todayInToronto };
