import { Global, Module } from '@nestjs/common';

import { ENV, type Env } from '../../config/config.module';
import { LocalStorageService } from './local-storage.service';
import { R2StorageService } from './r2-storage.service';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';

@Global()
@Module({
  controllers: [StorageController],
  providers: [
    {
      provide: StorageService,
      inject: [ENV],
      useFactory: (env: Env) => (env.STORAGE_DRIVER === 'r2' ? new R2StorageService(env) : new LocalStorageService(env)),
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
