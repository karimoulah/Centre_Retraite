import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AppError } from '../../common/app-error';
import type { AuthenticatedRequest } from '../../common/current-user.decorator';
import { ROLES_KEY } from '../../common/roles.decorator';
import type { Role } from '../../database/entities';

/** Global guard: checks @Roles() on the server, never only in the interface. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;
    const user = context.switchToHttp().getRequest<AuthenticatedRequest>().user;
    if (user && required.some((role) => user.roles.includes(role))) return true;
    throw new AppError(403, 'FORBIDDEN', "Vous n'avez pas accès à cette ressource.");
  }
}
