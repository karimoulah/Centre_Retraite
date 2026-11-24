import { Body, Controller, Get, HttpCode, Ip, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { CurrentUser } from '../../common/current-user.decorator';
import { Public } from '../../common/public.decorator';
import { Roles } from '../../common/roles.decorator';
import { UuidParam } from '../../common/uuid.pipe';
import type { User } from '../../database/entities';
import { DecisionDto, ListMembershipsQuery, MembershipApplicationDto, RejectDto } from './memberships.schemas';
import { MembershipsService } from './memberships.service';

@ApiTags('memberships')
@Controller('memberships')
export class MembershipsController {
  constructor(private readonly memberships: MembershipsService) {}

  /** Public membership form. 201 { id, status }. */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post()
  submit(@Body() body: MembershipApplicationDto, @Ip() ip: string) {
    return this.memberships.submit(body, ip);
  }

  @Roles('ADMIN')
  @Get()
  list(@Query() query: ListMembershipsQuery) {
    return this.memberships.list(query);
  }

  @Roles('ADMIN')
  @Get(':id')
  get(@Param('id', UuidParam) id: string) {
    return this.memberships.get(id);
  }

  /** Creates the member and, unless createAccount is false, a MEMBER account with an invitation. */
  @Roles('ADMIN')
  @HttpCode(200)
  @Post(':id/approve')
  approve(@Param('id', UuidParam) id: string, @Body() body: DecisionDto, @CurrentUser() user: User) {
    return this.memberships.approve(id, { userId: user.id }, body);
  }

  @Roles('ADMIN')
  @HttpCode(200)
  @Post(':id/reject')
  reject(@Param('id', UuidParam) id: string, @Body() body: RejectDto, @CurrentUser() user: User) {
    return this.memberships.reject(id, body, user.id);
  }
}
