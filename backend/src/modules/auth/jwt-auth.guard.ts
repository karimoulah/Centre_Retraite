import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';

import { AppError } from '../../common/app-error';
import type { AuthenticatedRequest } from '../../common/current-user.decorator';
import { IS_PUBLIC } from '../../common/public.decorator';
import { ENV, type Env } from '../../config/config.module';
import { User } from '../../database/entities';
import { TokenService } from './token.service';

/**
 * Global guard: every route requires a valid access token (cookie or Bearer) unless marked @Public().
 * The user is reloaded on each request, so a deactivated account loses access immediately.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService,
    private readonly dataSource: DataSource,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()]);
    const user = await this.userFrom(request);
    if (user) request.user = user;
    if (isPublic || user) return true;
    throw new AppError(401, 'UNAUTHORIZED', 'Authentification requise.');
  }

  private async userFrom(request: AuthenticatedRequest): Promise<User | null> {
    const header = request.headers.authorization;
    const token =
      (request.cookies?.[this.env.AUTH_ACCESS_COOKIE] as string | undefined) ??
      (header?.startsWith('Bearer ') ? header.slice(7) : undefined);
    if (!token) return null;
    try {
      const payload = await this.tokens.verifyAccess(token);
      if (payload.typ !== 'access') return null;
      return await this.dataSource.getRepository(User).findOneBy({ id: payload.sub, active: true });
    } catch {
      return null;
    }
  }
}
