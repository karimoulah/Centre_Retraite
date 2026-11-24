import { createZodDto } from 'nestjs-zod';

import { listQuerySchema } from '../../../common/pagination';
import { z } from '../../../common/zod';
import { ENTRY_DIRECTIONS, ENTRY_STATUSES, PAYMENT_METHODS } from '../../../database/entities';

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

export class CreateExpenseDto extends createZodDto(
  entryFields.extend({ supplier: z.string().trim().min(1, 'Le fournisseur est obligatoire.').max(160) }),
) {}
export class RejectExpenseDto extends createZodDto(
  z.object({ reason: z.string().trim().min(5, 'Le motif est obligatoire (5 caractères minimum).').max(500) }),
) {}

export class ListEntriesQuery extends createZodDto(
  listQuerySchema
    .extend({
      from: z.iso.date().optional(),
      to: z.iso.date().optional(),
      categoryId: z.uuid().optional(),
      contributorId: z.uuid().optional(),
      direction: z.enum(ENTRY_DIRECTIONS).optional(),
      status: z.enum(ENTRY_STATUSES).optional(),
      paymentMethod: z.enum(PAYMENT_METHODS).optional(),
      project: z.string().trim().max(120).optional(),
    })
    .refine((q) => !q.from || !q.to || q.from <= q.to, { message: 'La date de fin doit suivre la date de début.', path: ['to'] }),
) {}

export class ReverseEntryDto extends createZodDto(
  z.object({ reason: z.string().trim().min(5, 'Le motif est obligatoire (5 caractères minimum).').max(500) }),
) {}
