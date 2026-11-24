import { Body, Controller, Get, Patch, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/current-user.decorator';
import type { User } from '../../database/entities';
import { UpdateConsentsDto, UpdateMyProfileDto } from './members.schemas';
import { MeService } from './me.service';

/** Member space: any signed-in account linked to a member record (404 NOT_A_MEMBER otherwise). */
@ApiTags('me')
@Controller('me')
export class MeController {
  constructor(private readonly me: MeService) {}

  @Get('profile')
  profile(@CurrentUser() user: User) {
    return this.me.profile(user);
  }

  @Patch('profile')
  updateProfile(@CurrentUser() user: User, @Body() body: UpdateMyProfileDto) {
    return this.me.updateProfile(user, body);
  }

  @Get('consents')
  consents(@CurrentUser() user: User) {
    return this.me.consents(user);
  }

  @Put('consents')
  updateConsents(@CurrentUser() user: User, @Body() body: UpdateConsentsDto) {
    return this.me.updateConsents(user, body);
  }
}
