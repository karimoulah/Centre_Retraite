import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Roles } from '../../common/roles.decorator';
import { UuidParam } from '../../common/uuid.pipe';
import { ListMembersQuery, UpdateMemberDto } from './members.schemas';
import { MembersService } from './members.service';

@ApiTags('members')
@Roles('ADMIN')
@Controller('members')
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Get()
  list(@Query() query: ListMembersQuery) {
    return this.members.list(query);
  }

  @Get(':id')
  get(@Param('id', UuidParam) id: string) {
    return this.members.get(id);
  }

  @Patch(':id')
  update(@Param('id', UuidParam) id: string, @Body() body: UpdateMemberDto) {
    return this.members.update(id, body);
  }

  @HttpCode(200)
  @Post(':id/deactivate')
  deactivate(@Param('id', UuidParam) id: string) {
    return this.members.deactivate(id);
  }
}
