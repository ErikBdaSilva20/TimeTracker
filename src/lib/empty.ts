const FROZEN_EMPTY_ARRAY: readonly unknown[] = Object.freeze([]);

/**
 * Stable empty-array fallback for `useQuery` reads (`query.data ?? emptyArray<Row>()`).
 * A fresh `[]` literal gets a new reference every render, which silently
 * defeats any `useMemo`/`useCallback` downstream that depends on it while
 * the query is still loading. This returns the same frozen reference every
 * call, for any row type, since an empty array is never mutated by callers.
 */
export function emptyArray<T>(): T[] {
  return FROZEN_EMPTY_ARRAY as T[];
}
