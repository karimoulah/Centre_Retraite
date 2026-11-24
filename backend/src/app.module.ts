import { Module } from '@nestjs/common';

import { CommonModule } from './common/common.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { LoggingModule } from './infrastructure/logging/logging.module';
import { MailModule } from './infrastructure/mail/mail.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({ imports: [ConfigModule, LoggingModule, CommonModule, DatabaseModule, RedisModule, MailModule, NotificationsModule, AuditModule, HealthModule, AuthModule] })
export class AppModule {}
