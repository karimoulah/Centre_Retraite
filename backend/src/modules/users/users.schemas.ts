import { createZodDto } from 'nestjs-zod';

import { listQuerySchema } from '../../common/pagination';
import { z } from '../../common/zod';
import { ROLES } from '../../database/entities';

const name = (label: string) => z.string().trim().min(1, `${label} est obligatoire.`).max(80);
const roles = z.array(z.enum(ROLES)).min(1, 'Choisissez au moins un rôle.').transform((list) => [...new Set(list)]);

export class CreateUserDto extends createZodDto(
  z.object({ email: z.email().trim().toLowerCase(), firstName: name('Le prénom'), lastName: name('Le nom'), roles }),
) {}
export class UpdateUserDto extends createZodDto(z.object({ firstName: name('Le prénom'), lastName: name('Le nom') }).partial()) {}
export class UpdateRolesDto extends createZodDto(z.object({ roles })) {}
export class ListUsersQuery extends createZodDto(
  listQuerySchema.extend({ role: z.enum(ROLES).optional(), status: z.enum(['active', 'inactive', 'pending']).optional() }),
) {}
