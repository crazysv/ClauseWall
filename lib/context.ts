import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestContext {
  reqId?: string;
  docId?: string;
  userId?: string;
  [key: string]: unknown;
}

const contextStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Access the current structured request context.
 * Returns an empty object if called outside of a context wrapper.
 */
export function getRequestContext(): RequestContext {
  return contextStorage.getStore() || {};
}

/**
 * Run a callback within a newly initialized request context.
 */
export function runWithContext<T>(
  context: RequestContext,
  callback: () => T
): T {
  return contextStorage.run(context, callback);
}
