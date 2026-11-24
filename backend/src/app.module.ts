import { Module } from '@nestjs/common';

import { CommonModule } from './common/common.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { LoggingModule } from './infrastructure/logging/logging.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { HealthModule } from './modules/health/health.module';

@Module({ imports: [ConfigModule, LoggingModule, CommonModule, DatabaseModule, RedisModule, HealthModule] })
export class AppModule {}
