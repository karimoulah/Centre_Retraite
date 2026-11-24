import { createZodDto } from 'nestjs-zod';

import { z } from '../../../common/zod';

/** Up to 1 000 000 $; the frontend sends dollars converted to cents. */
export const amountCents = z
  .number({ message: 'Le montant est obligatoire.' })
  .int('Le montant doit être en cents.')
  .positive('Le montant doit être supérieur à 0 $.')
  .max(100_000_000, 'Le montant ne peut pas dépasser 1 000 000 $.');

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((value) => value || null);

/** Fields shared by income and expenses. ONLINE is reserved to online donations. */
export const entryFields = z.object({
  amountCents,
  entryDate: z.iso.date().refine((d) => d <= today(), 'La date ne peut pas être dans le futur.'),
  categoryId: z.uuid('Choisissez une catégorie.'),
  paymentMethod: z.enum(['CASH', 'CHEQUE', 'CARD', 'TRANSFER', 'OTHER'], { message: 'Choisissez un mode de paiement.' }),
  description: z.string().trim().min(1, 'La description est obligatoire.').max(500),
  project: optional(120),
});

export const incomeSchema = entryFields.extend({ contributorId: z.uuid().nullable().optional() });
export class CreateIncomeDto extends createZodDto(incomeSchema) {}

/** PATCH /entries/:id (drafts only). contributorId applies to income, supplier to expenses. */
export class UpdateEntryDto extends createZodDto(
  entryFields.extend({ contributorId: z.uuid().nullable(), supplier: optional(160) }).partial().strict(),
) {}
