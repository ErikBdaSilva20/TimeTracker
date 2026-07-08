import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { timerSessionsRepo } from "@/lib/data";
import { elapsedSince } from "@/lib/timer-session";

const CHECKPOINT_INTERVAL_MS = 30_000;
const TICK_INTERVAL_MS = 1_000;

export interface UseTimerSessionResult {
  projectId: string;
  setProjectId: (id: string) => void;
  taskId: string;
  setTaskId: (id: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  seconds: number;
  running: boolean;
  /** True while checking for/restoring a session left open by a reload or crash. */
  restoring: boolean;
  /** True exactly once, if the mount recovery found an open session to resume. */
  recovered: boolean;
  start: () => Promise<void>;
  pause: () => Promise<void>;
  /** Stops ticking, deletes the persisted session, and returns the final elapsed seconds. */
  finalize: () => Promise<number>;
}

/**
 * Persists a running/paused timer to the `timer_sessions` table so an
 * in-progress session survives a tab close, refresh, browser crash, or the
 * OS suspending the machine (audit 4.1 — previously the timer lived only in
 * `useState`, and every unsaved second was lost silently).
 *
 * Elapsed time is checkpointed to the row periodically and whenever the tab
 * is hidden, and recovered on mount — worst case a crash loses one
 * checkpoint interval's worth of time, not the entire session.
 */
export function useTimerSession(): UseTimerSessionResult {
  const { user } = useAuth();

  const [projectId, setProjectId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [notes, setNotes] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [recovered, setRecovered] = useState(false);

  const sessionIdRef = useRef<string | null>(null);
  const startedAtRef = useRef<string | null>(null);
  const accumulatedRef = useRef(0);

  useEffect(() => {
    if (!user) {
      setRestoring(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        // No get-by-id/filter in the generic gateway (Importantdoc.md §B5):
        // list everything visible to this role and filter client-side. For
        // admin/manager that list includes every tenant member's sessions,
        // so scope to owner_id to only ever resume *my* timer.
        const sessions = await timerSessionsRepo.list();
        const mine = sessions.find((s) => s.owner_id === user.id && s.status !== "stopped");
        if (!cancelled && mine) {
          sessionIdRef.current = mine.id;
          accumulatedRef.current = mine.accumulated_seconds;
          setProjectId(mine.project_id ?? "");
          setTaskId(mine.task_id ?? "");
          setNotes(mine.description ?? "");
          if (mine.status === "running" && mine.started_at) {
            startedAtRef.current = mine.started_at;
            setSeconds(elapsedSince(mine.started_at, mine.accumulated_seconds));
            setRunning(true);
          } else {
            setSeconds(mine.accumulated_seconds);
          }
          setRecovered(true);
        }
      } catch {
        // Recovery is best-effort — a flaky read shouldn't block starting a fresh timer.
      } finally {
        if (!cancelled) setRestoring(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Local 1s tick while running. Reads the refs live on every fire (instead
  // of capturing them once) so a checkpoint's anchor reset mid-run doesn't
  // leave this interval computing off stale values.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (startedAtRef.current)
        setSeconds(elapsedSince(startedAtRef.current, accumulatedRef.current));
    }, TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [running]);

  const checkpoint = useCallback(async () => {
    if (!sessionIdRef.current || !startedAtRef.current) return;
    const rolledUp = elapsedSince(startedAtRef.current, accumulatedRef.current);
    const nowIso = new Date().toISOString();
    accumulatedRef.current = rolledUp;
    startedAtRef.current = nowIso;
    try {
      await timerSessionsRepo.update(sessionIdRef.current, {
        accumulated_seconds: rolledUp,
        started_at: nowIso,
      });
    } catch {
      // Best-effort checkpoint — a missed write only widens the crash-loss window slightly.
    }
  }, []);

  // Periodic network checkpoint, plus a flush the moment the tab is hidden —
  // `beforeunload` fetches are unreliable across browsers, so "tab hidden"
  // is the practical last chance to persist before a close/suspend.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => void checkpoint(), CHECKPOINT_INTERVAL_MS);
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") void checkpoint();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [running, checkpoint]);

  const start = useCallback(async () => {
    const nowIso = new Date().toISOString();
    if (!sessionIdRef.current) {
      const created = await timerSessionsRepo.create({
        status: "running",
        started_at: nowIso,
        accumulated_seconds: 0,
        project_id: projectId || null,
        task_id: taskId || null,
        description: notes || null,
      });
      sessionIdRef.current = created.id;
      accumulatedRef.current = 0;
    } else {
      await timerSessionsRepo.update(sessionIdRef.current, {
        status: "running",
        started_at: nowIso,
      });
    }
    startedAtRef.current = nowIso;
    setRunning(true);
  }, [projectId, taskId, notes]);

  const pause = useCallback(async () => {
    if (!sessionIdRef.current || !startedAtRef.current) {
      setRunning(false);
      return;
    }
    const rolledUp = elapsedSince(startedAtRef.current, accumulatedRef.current);
    accumulatedRef.current = rolledUp;
    setRunning(false);
    setSeconds(rolledUp);
    try {
      await timerSessionsRepo.update(sessionIdRef.current, {
        status: "paused",
        paused_at: new Date().toISOString(),
        accumulated_seconds: rolledUp,
      });
    } catch {
      // Paused locally regardless; the row self-corrects on the next checkpoint/finalize.
    }
  }, []);

  const finalize = useCallback(async () => {
    const finalSeconds =
      running && startedAtRef.current
        ? elapsedSince(startedAtRef.current, accumulatedRef.current)
        : accumulatedRef.current;
    setRunning(false);
    if (sessionIdRef.current) {
      try {
        await timerSessionsRepo.remove(sessionIdRef.current);
      } catch {
        // Left as "running/paused" in the DB — next mount's recovery will surface
        // it again instead of the time being lost.
      }
    }
    sessionIdRef.current = null;
    startedAtRef.current = null;
    accumulatedRef.current = 0;
    setSeconds(0);
    setNotes("");
    return finalSeconds;
  }, [running]);

  return {
    projectId,
    setProjectId,
    taskId,
    setTaskId,
    notes,
    setNotes,
    seconds,
    running,
    restoring,
    recovered,
    start,
    pause,
    finalize,
  };
}
