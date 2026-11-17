import { ROLES } from '@/lib/api/contracts';
import { fields, z } from '@/lib/zod';

export const rolesField = z.array(z.enum(ROLES)).min(1, 'Choisissez au moins un rôle.');

export const createUserSchema = z.object({
  firstName: fields.requiredText('Le prénom', 80),
  lastName: fields.requiredText('Le nom', 80),
  email: fields.email(),
  roles: rolesField,
});
export type CreateUserValues = z.infer<typeof createUserSchema>;

export const updateUserSchema = createUserSchema.pick({ firstName: true, lastName: true });
export type UpdateUserValues = z.infer<typeof updateUserSchema>;

export const rolesSchema = z.object({ roles: rolesField });
export type RolesValues = z.infer<typeof rolesSchema>;
