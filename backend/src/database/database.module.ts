import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ENV, type Env } from '../config/config.module';
import { typeormOptions } from './typeorm-options';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ENV],
      // Pending migrations run at start-up, so a fresh clone works with `pnpm start:dev` alone.
      useFactory: (env: Env) => ({ ...typeormOptions(env), migrationsRun: true, autoLoadEntities: false }),
    }),
  ],
})
export class DatabaseModule {}
