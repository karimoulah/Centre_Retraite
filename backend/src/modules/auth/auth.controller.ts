import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { CurrentUser } from '../../common/current-user.decorator';
import { Public } from '../../common/public.decorator';
import { ENV, type Env } from '../../config/config.module';
import type { User } from '../../database/entities';
import { toSessionUser } from '../users/user.mapper';
import { LoginDto } from './auth.schemas';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /** Sets the access_token and refresh_token httpOnly cookies. */
  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.auth.login(body.email, body.password, res);
  }

  /** Revokes the session and clears the cookies; succeeds even when the session already expired. */
  @Public()
  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.[this.env.AUTH_REFRESH_COOKIE], res);
  }

  /** New pair of cookies from the refresh_token cookie (called by the frontend middleware). */
  @Public()
  @Post('refresh')
  @HttpCode(200)
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.auth.refresh(req.cookies?.[this.env.AUTH_REFRESH_COOKIE], res);
  }

  /** The signed-in user: id, e-mail, names, roles and member id. */
  @Get('me')
  me(@CurrentUser() user: User) {
    return toSessionUser(user);
  }
}
