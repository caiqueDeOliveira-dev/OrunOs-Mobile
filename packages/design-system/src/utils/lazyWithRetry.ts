import { lazy, ComponentType } from "react";

const STORAGE_KEY = "orun-chunk-retry-attempted";

export interface LazyRetryDeps {
  reload: () => void;
  getFlag: () => string | null;
  setFlag: (value: string) => void;
  clearFlag: () => void;
}

const browserDeps: LazyRetryDeps = {
  reload: () => window.location.reload(),
  getFlag: () => sessionStorage.getItem(STORAGE_KEY),
  setFlag: (value) => sessionStorage.setItem(STORAGE_KEY, value),
  clearFlag: () => sessionStorage.removeItem(STORAGE_KEY),
};

/**
 * `React.lazy(factory)` calls `factory()` exactly once and caches the
 * result FOREVER — including a rejection. If a chunk fails to load (the
 * classic case: the app was redeployed, the browser has an old HTML with
 * hashed chunk URLs that no longer exist on the server), that route is
 * permanently broken until a full page reload, no matter how many times an
 * ErrorBoundary's "retry" button just clears local component state.
 *
 * This wraps the factory so exactly ONE reload is attempted automatically
 * on failure (the fix for the common case), tracked via sessionStorage so
 * it can't reload-loop forever on a genuine, persistent failure — after one
 * reload attempt, the error is allowed to reach the ErrorBoundary for real.
 *
 * Call `clearChunkRetryFlag()` once the app has successfully mounted (see
 * the useEffect in App.tsx) so a *future* deploy gets its own fresh retry
 * attempt instead of being silently blocked by a flag left over from a
 * previous session.
 */
/**
 * The actual retry-once logic, factored out of `lazy()`'s closure so it can
 * be unit-tested directly without poking at React.lazy's internal fiber
 * shape. `lazyWithRetry` below is a thin wrapper that hands this to `lazy()`.
 */
export async function resolveWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  deps: LazyRetryDeps
): Promise<{ default: T }> {
  try {
    const module = await factory();
    deps.clearFlag(); // this chunk loaded fine — don't let a stale flag affect other chunks
    return module;
  } catch (error) {
    const alreadyRetried = deps.getFlag() === "true";
    if (!alreadyRetried) {
      deps.setFlag("true");
      deps.reload();
      // Reloading is async from JS's perspective; return a promise that
      // never resolves so React doesn't render a broken state in the
      // brief moment before the reload actually happens.
      return new Promise<{ default: T }>(() => {});
    }
    throw error;
  }
}

export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  deps: LazyRetryDeps = browserDeps
) {
  return lazy(() => resolveWithRetry(factory, deps));
}

export function clearChunkRetryFlag(deps: LazyRetryDeps = browserDeps) {
  deps.clearFlag();
}
