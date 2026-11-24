import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { ENV, type Env } from '../../config/config.module';

/** Per-IP request limit on every route; routes tighten it with @Throttle. Registered before the auth guards. */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [ENV],
      useFactory: (env: Env) => ({
        throttlers: [{ name: 'default', ttl: 60_000, limit: env.THROTTLE_LIMIT }],
        skipIf: () => !env.THROTTLE_ENABLED,
      }),
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class SecurityModule {}
