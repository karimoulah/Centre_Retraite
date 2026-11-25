import { createZodDto } from 'nestjs-zod';

import { listQuerySchema } from '../../common/pagination';
import { z } from '../../common/zod';
import { AGE_CATEGORIES, SEXES } from '../../database/entities';

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
      sex: z.enum(SEXES),
      ageCategory: z.enum(AGE_CATEGORIES),
      birthDate: z.iso
        .date()
        .nullable()
        .refine((value) => !value || new Date(value) < new Date(), 'La date de naissance doit être dans le passé.'),
    })
    .partial(),
) {}

/** PATCH /me/profile: the member may only change how to reach them. */
export class UpdateMyProfileDto extends createZodDto(z.object({ phone, address }).partial().strict()) {}

/** PUT /me/consents: only the keys sent change. */
export class UpdateConsentsDto extends createZodDto(
  z
    .object({ birthdayWishes: z.boolean(), newsletter: z.boolean(), testimonialPublication: z.boolean() })
    .partial()
    .strict(),
) {}
