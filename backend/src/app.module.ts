import { Module } from '@nestjs/common';

import { CommonModule } from './common/common.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { LoggingModule } from './infrastructure/logging/logging.module';
import { MailModule } from './infrastructure/mail/mail.module';
import { TurnstileModule } from './infrastructure/turnstile/turnstile.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MembersModule } from './modules/members/members.module';
import { MembershipsModule } from './modules/memberships/memberships.module';
import { SettingsModule } from './modules/settings/settings.module';
import { UsersModule } from './modules/users/users.module';

@Module({ imports: [ConfigModule, LoggingModule, CommonModule, DatabaseModule, RedisModule, MailModule, TurnstileModule, NotificationsModule, AuditModule, HealthModule, AuthModule, UsersModule, SettingsModule, MembershipsModule, MembersModule] })
export class AppModule {}
