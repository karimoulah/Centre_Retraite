import { AsyncLocalStorage } from 'node:async_hooks';

import type { EntityManager } from 'typeorm';

type Context = { manager: EntityManager };
const storage = new AsyncLocalStorage<Context>();

/** The EntityManager of the current request's transaction, if one is open. */
export const RequestContext = {
  run: <T>(context: Context, fn: () => Promise<T>) => storage.run(context, fn),
  manager: (): EntityManager | undefined => storage.getStore()?.manager,
};
