import { Body, Controller, Get, HttpCode, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/current-user.decorator';
import { Roles } from '../../common/roles.decorator';
import { UuidParam } from '../../common/uuid.pipe';
import type { User } from '../../database/entities';
import { CreateUserDto, ListUsersQuery, UpdateRolesDto, UpdateUserDto } from './users.schemas';
import { UsersService } from './users.service';

@ApiTags('users')
@Roles('ADMIN')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(@Query() query: ListUsersQuery) {
    return this.users.list(query);
  }

  @Post()
  create(@Body() body: CreateUserDto) {
    return this.users.create(body);
  }

  @Get(':id')
  get(@Param('id', UuidParam) id: string) {
    return this.users.get(id);
  }

  @Patch(':id')
  update(@Param('id', UuidParam) id: string, @Body() body: UpdateUserDto) {
    return this.users.update(id, body);
  }

  /** Replaces the whole list of roles. */
  @Put(':id/roles')
  setRoles(@Param('id', UuidParam) id: string, @Body() body: UpdateRolesDto, @CurrentUser() actor: User) {
    return this.users.setRoles(id, body.roles, actor);
  }

  @Post(':id/deactivate')
  @HttpCode(200)
  deactivate(@Param('id', UuidParam) id: string, @CurrentUser() actor: User) {
    return this.users.deactivate(id, actor);
  }
}
