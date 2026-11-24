import { Global, Module } from '@nestjs/common';

import { loadEnv } from './config';
import type { Env } from './env.schema';

export const ENV = Symbol('ENV');
export type { Env };

@Global()
@Module({
  providers: [{ provide: ENV, useFactory: () => loadEnv() }],
  exports: [ENV],
})
export class ConfigModule {}
