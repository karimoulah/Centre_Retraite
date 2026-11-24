import { AsyncLocalStorage } from 'node:async_hooks';

import type { EntityManager } from 'typeorm';

type Context = { manager: EntityManager; afterCommit: Array<() => Promise<unknown>> };
const storage = new AsyncLocalStorage<Context>();

/** The EntityManager of the current request's transaction, and work to run once it commits. */
export const RequestContext = {
  run: <T>(context: Context, fn: () => Promise<T>) => storage.run(context, fn),
  manager: (): EntityManager | undefined => storage.getStore()?.manager,
  /** Runs `fn` after the transaction commits (or right away outside a transaction); never on rollback. */
  afterCommit: async (fn: () => Promise<unknown>): Promise<void> => {
    const store = storage.getStore();
    if (store) store.afterCommit.push(fn);
    else await fn();
  },
};

/** Runs the callbacks registered during a committed transaction. */
export async function flushAfterCommit(callbacks: Array<() => Promise<unknown>>): Promise<void> {
  for (const callback of callbacks) await callback();
}
