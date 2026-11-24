import { createZodDto } from 'nestjs-zod';

import { listQuerySchema } from '../../common/pagination';
import { z } from '../../common/zod';
import { AGE_CATEGORIES } from '../../database/entities';

const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((value) => value || null);

export const phone = nullableText(30);
export const address = nullableText(300);

export class ListMembersQuery extends createZodDto(
  listQuerySchema.extend({ status: z.enum(['active', 'inactive']).optional(), ageCategory: z.enum(AGE_CATEGORIES).optional() }),
) {}

export class UpdateMemberDto extends createZodDto(
  z
    .object({
      firstName: z.string().trim().min(1, 'Le prénom est obligatoire.').max(80),
      lastName: z.string().trim().min(1, 'Le nom est obligatoire.').max(80),
      email: z.email().trim().toLowerCase(),
      phone,
      address,
      ageCategory: z.enum(AGE_CATEGORIES),
      birthDate: z.iso
        .date()
        .nullable()
        .refine((value) => !value || new Date(value) < new Date(), 'La date de naissance doit être dans le passé.'),
    })
    .partial(),
) {}
