import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';

import { CurrentUser } from '../../common/current-user.decorator';
import { Roles } from '../../common/roles.decorator';
import { z } from '../../common/zod';
import type { User } from '../../database/entities';
import { SettingsService } from './settings.service';

class MembershipSettingsDto extends createZodDto(z.object({ autoApprove: z.boolean() })) {}

@ApiTags('settings')
@Roles('ADMIN')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  /** Automatic approval of membership requests. */
  @Get('membership')
  membership() {
    return this.settings.membershipView();
  }

  @Put('membership')
  setMembership(@Body() body: MembershipSettingsDto, @CurrentUser() user: User) {
    return this.settings.setMembership(body, user.id);
  }
}
