import { SetMetadata } from '@nestjs/common';

import type { Role } from '../database/entities';

export const ROLES_KEY = 'roles';
/** The signed-in user needs at least one of these roles (403 otherwise). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
