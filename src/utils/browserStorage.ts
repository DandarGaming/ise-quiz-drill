export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

// Storage can be missing (server render) or throw (private mode, full
// quota); the app must keep working without it.
export function safely<T>(action: () => T): T | undefined {
  try {
    return action();
  } catch {
    return undefined;
  }
}

export const browserStorage = (): KeyValueStore | undefined =>
  typeof window === 'undefined' ? undefined : safely(() => window.localStorage);
