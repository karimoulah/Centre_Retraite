import { Injectable } from '@nestjs/common';
import { DataSource, type EntityManager, type EntityTarget, type ObjectLiteral, type Repository } from 'typeorm';

import { flushAfterCommit, RequestContext } from './request-context';

/** Gives services the request's transactional manager, so every write of a request commits or rolls back together. */
@Injectable()
export class Tx {
  constructor(private readonly dataSource: DataSource) {}

  get manager(): EntityManager {
    return RequestContext.manager() ?? this.dataSource.manager;
  }

  repo<E extends ObjectLiteral>(entity: EntityTarget<E>): Repository<E> {
    return this.manager.getRepository(entity);
  }

  /** Runs `fn` in a transaction outside of an HTTP request (queues, scripts), with an optional author. */
  async run<T>(fn: (manager: EntityManager) => Promise<T>, actorId?: string | null): Promise<T> {
    const afterCommit: Array<() => Promise<unknown>> = [];
    const result = await this.dataSource.transaction(async (manager) => {
      await setActor(manager, actorId);
      return RequestContext.run({ manager, afterCommit }, () => fn(manager));
    });
    await flushAfterCommit(afterCommit);
    return result;
  }
}

/** SET LOCAL app.actor_id: the database records this author in audit_logs for the rest of the transaction. */
export async function setActor(manager: EntityManager, actorId?: string | null) {
  await manager.query(`SELECT set_config('app.actor_id', $1, true)`, [actorId ?? '']);
}
