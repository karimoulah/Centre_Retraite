import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import { from, lastValueFrom, type Observable } from 'rxjs';
import { DataSource } from 'typeorm';

import { flushAfterCommit, RequestContext } from './request-context';
import { setActor } from './transaction.service';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * One transaction per request that modifies data, with SET LOCAL app.actor_id = the signed-in user.
 * Everything the handler writes (rows and audit lines) commits together or not at all.
 */
@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { user?: { id: string } }>();
    if (!WRITE_METHODS.has(request.method)) return next.handle();

    const afterCommit: Array<() => Promise<unknown>> = [];
    return from(
      this.dataSource
        .transaction(async (manager) => {
          await setActor(manager, request.user?.id);
          return RequestContext.run({ manager, afterCommit }, () =>
            lastValueFrom(next.handle(), { defaultValue: undefined }),
          );
        })
        .then(async (result) => {
          await flushAfterCommit(afterCommit);
          return result;
        }),
    );
  }
}
