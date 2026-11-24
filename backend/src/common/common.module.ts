import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';

import { HttpExceptionFilter } from './http-exception.filter';
import { TransactionInterceptor } from './transaction/transaction.interceptor';
import { Tx } from './transaction/transaction.service';

@Global()
@Module({
  providers: [
    Tx,
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: TransactionInterceptor },
  ],
  exports: [Tx],
})
export class CommonModule {}
