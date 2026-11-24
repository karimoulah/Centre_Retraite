import { Body, Controller, HttpCode, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { Public } from '../../common/public.decorator';
import { LoginDto } from './auth.schemas';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Sets the access_token and refresh_token httpOnly cookies. */
  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.auth.login(body.email, body.password, res);
  }
}
