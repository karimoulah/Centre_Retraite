import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../../common/current-user.decorator';
import { Roles } from '../../../common/roles.decorator';
import { UuidParam } from '../../../common/uuid.pipe';
import type { User } from '../../../database/entities';
import { CreateIncomeDto, ListEntriesQuery, UpdateEntryDto } from './entries.schemas';
import { EntriesService } from './entries.service';
import { ExpensesService } from './expenses';

@ApiTags('finance')
@Roles('FINANCE')
@Controller('entries')
export class EntriesController {
  constructor(
    private readonly entries: EntriesService,
    private readonly expenses: ExpensesService,
  ) {}

  /** Filters, page and the totals of the whole selection. */
  @Get()
  list(@Query() query: ListEntriesQuery) {
    return this.entries.list(query);
  }

  @Get(':id')
  get(@Param('id', UuidParam) id: string) {
    return this.entries.detail(id);
  }

  /** New income (DRAFT). Expenses use POST /expenses. */
  @Post()
  create(@Body() body: CreateIncomeDto, @CurrentUser() user: User) {
    return this.entries.createIncome(body, user.id);
  }

  @Patch(':id')
  update(@Param('id', UuidParam) id: string, @Body() body: UpdateEntryDto) {
    return this.entries.updateDraft(id, body, (entry) => this.expenses.resubmitIfNeeded(entry));
  }

  @HttpCode(204)
  @Delete(':id')
  async remove(@Param('id', UuidParam) id: string) {
    await this.entries.deleteDraft(id);
  }
}
