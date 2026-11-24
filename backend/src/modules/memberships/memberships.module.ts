import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { MembersModule } from '../members/members.module';
import { SettingsModule } from '../settings/settings.module';
import { MembershipsController } from './memberships.controller';
import { MembershipsService } from './memberships.service';

@Module({
  imports: [AuthModule, MembersModule, SettingsModule],
  controllers: [MembershipsController],
  providers: [MembershipsService],
})
export class MembershipsModule {}
