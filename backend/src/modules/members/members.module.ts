import { Module } from '@nestjs/common';

import { MeController } from './me.controller';
import { MeService } from './me.service';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';

@Module({ controllers: [MembersController, MeController], providers: [MembersService, MeService], exports: [MembersService] })
export class MembersModule {}
