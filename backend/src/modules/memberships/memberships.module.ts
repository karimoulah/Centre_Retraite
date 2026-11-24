import { Module } from '@nestjs/common';

import { MembersModule } from '../members/members.module';
import { SettingsModule } from '../settings/settings.module';
import { MembershipsController } from './memberships.controller';
import { MembershipsService } from './memberships.service';

@Module({
  imports: [MembersModule, SettingsModule],
  controllers: [MembershipsController],
  providers: [MembershipsService],
})
export class MembershipsModule {}
