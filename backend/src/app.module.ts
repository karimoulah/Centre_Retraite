import { Module } from '@nestjs/common';

import { CommonModule } from './common/common.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';

@Module({ imports: [ConfigModule, CommonModule, DatabaseModule] })
export class AppModule {}
