/**
 * Work done in slices in the browser's idle moments, so no frame waits on it for long - the
 * walk world and its route grid are built this way. See design.md D2 of speed-up-the-hub.
 */

/**
 * A piece of work done in slices: each call works until `hasTime` says stop, resuming where
 * the last one stopped, and says whether the work is finished.
 */
export type SlicedWork = (hasTime: () => boolean) => boolean;

/** Calls back in an idle moment with how long that moment has left, in milliseconds. */
export interface IdleScheduler {
  readonly schedule: (callback: (remaining: () => number) => void) => number;
  readonly cancel: (handle: number) => void;
}

/** A slice never runs shorter than this, in milliseconds, so the work moves on a busy page... */
const MIN_SLICE_MS = 4;
/** ...nor longer than this, so the next frame is never held for long. */
const MAX_SLICE_MS = 12;
/** How long a slice waits for an idle moment before it runs anyway, in milliseconds. */
const IDLE_TIMEOUT_MS = 100;
/** Where there is no idle callback (Safari), the gap between two slices, in milliseconds. */
const FALLBACK_GAP_MS = 16;

function browserScheduler(): IdleScheduler {
  if (typeof window.requestIdleCallback === "function") {
    return {
      schedule: (callback) => window.requestIdleCallback((deadline) => callback(() => deadline.timeRemaining()), { timeout: IDLE_TIMEOUT_MS }),
      cancel: (handle) => window.cancelIdleCallback(handle),
    };
  }
  return {
    schedule: (callback) => window.setTimeout(() => callback(() => MIN_SLICE_MS), FALLBACK_GAP_MS),
    cancel: (handle) => window.clearTimeout(handle),
  };
}

/** A clock for one slice: true until the slice has run for `budget` milliseconds. */
export function sliceClock(budget: number, now: () => number = () => performance.now()): () => boolean {
  const start = now();
  return () => now() - start < budget;
}

/** How long a slice may run, from how long the idle moment has left. */
export function sliceBudget(remaining: number): number {
  return Math.min(MAX_SLICE_MS, Math.max(MIN_SLICE_MS, remaining));
}

/**
 * Runs sliced work in idle moments, one slice per moment, then calls `onDone`. Returns a
 * function that cancels whatever has not run yet; `onDone` is then never called.
 */
export function runWhenIdle(work: SlicedWork, onDone: () => void = () => undefined, scheduler: IdleScheduler = browserScheduler()): () => void {
  let cancelled = false;
  let handle = 0;
  const slice = (remaining: () => number): void => {
    if (cancelled) return;
    if (work(sliceClock(sliceBudget(remaining())))) onDone();
    else handle = scheduler.schedule(slice);
  };
  handle = scheduler.schedule(slice);
  return () => {
    cancelled = true;
    scheduler.cancel(handle);
  };
}
