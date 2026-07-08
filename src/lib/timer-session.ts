/**
 * Elapsed seconds is recomputed from the wall-clock delta (`now - startedAt`)
 * on every call instead of counting local `setInterval` ticks — a throttled
 * background tab (inactive desktop tab, mobile browser) fires timers slower
 * than 1/s, so tick-counting silently undercounts. Recomputing from the
 * clock self-corrects regardless of how late a tick fires, and is what lets
 * a reload/crash recovery compute the right value from `started_at` alone.
 */
export function elapsedSince(
  startedAtIso: string,
  accumulatedSeconds: number,
  nowMs: number = Date.now(),
): number {
  const startedAtMs = new Date(startedAtIso).getTime();
  return accumulatedSeconds + Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
}
