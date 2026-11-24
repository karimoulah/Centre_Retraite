import { Body, Controller, Get, Ip, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { Public } from '../../common/public.decorator';
import { Roles } from '../../common/roles.decorator';
import { UuidParam } from '../../common/uuid.pipe';
import { ListMembershipsQuery, MembershipApplicationDto } from './memberships.schemas';
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
}
