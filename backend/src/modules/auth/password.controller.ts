import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/public.decorator';
import { ForgotPasswordDto, ResetPasswordDto } from './password.schemas';
import { PasswordService } from './password.service';

@ApiTags('auth')
@Controller('auth/password')
export class PasswordController {
  constructor(private readonly passwords: PasswordService) {}

  /** Sends a reset link valid 1 hour if the account exists; same answer otherwise. */
  @Public()
  @Post('forgot')
  @HttpCode(200)
  forgot(@Body() body: ForgotPasswordDto) {
    return this.passwords.forgot(body.email);
  }

  /** 410 TOKEN_EXPIRED when the link is unknown, expired or already used. */
  @Public()
  @Post('reset')
  @HttpCode(200)
  reset(@Body() body: ResetPasswordDto) {
    return this.passwords.reset(body.token, body.password);
  }
}
