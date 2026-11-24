import { Body, Controller, Delete, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../../common/current-user.decorator';
import { Roles } from '../../../common/roles.decorator';
import { UuidParam } from '../../../common/uuid.pipe';
import type { User } from '../../../database/entities';
import { CreateIncomeDto, UpdateEntryDto } from './entries.schemas';
import { EntriesService } from './entries.service';

@ApiTags('finance')
@Roles('FINANCE')
@Controller('entries')
export class EntriesController {
  constructor(private readonly entries: EntriesService) {}

  /** New income (DRAFT). Expenses use POST /expenses. */
  @Post()
  create(@Body() body: CreateIncomeDto, @CurrentUser() user: User) {
    return this.entries.createIncome(body, user.id);
  }

  @Patch(':id')
  update(@Param('id', UuidParam) id: string, @Body() body: UpdateEntryDto) {
    return this.entries.updateDraft(id, body);
  }

  @HttpCode(204)
  @Delete(':id')
  async remove(@Param('id', UuidParam) id: string) {
    await this.entries.deleteDraft(id);
  }
}
