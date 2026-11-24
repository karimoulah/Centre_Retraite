import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';

import { CurrentUser } from '../../common/current-user.decorator';
import { Roles } from '../../common/roles.decorator';
import { z } from '../../common/zod';
import type { User } from '../../database/entities';
import { SettingsService } from './settings.service';

class MembershipSettingsDto extends createZodDto(z.object({ autoApprove: z.boolean() })) {}
class FinanceSettingsDto extends createZodDto(
  z.object({
    expenseApprovalThresholdCents: z
      .number({ message: 'Le seuil est obligatoire.' })
      .int('Le seuil doit être en cents.')
      .min(0, 'Le seuil ne peut pas être négatif.')
      .max(100_000_000, 'Le seuil ne peut pas dépasser 1 000 000 $.'),
  }),
) {}

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

  /** Expense approval threshold: read by finance (the expense form shows it), changed by an administrator. */
  @Roles('ADMIN', 'FINANCE')
  @Get('finance')
  finance() {
    return this.settings.financeView();
  }

  @Put('finance')
  setFinance(@Body() body: FinanceSettingsDto, @CurrentUser() user: User) {
    return this.settings.setFinance(body, user.id);
  }
}
