import { startOfDay, startOfWeek } from "date-fns";
import { useMemo } from "react";

export interface DateBoundaries {
  /** Raw "now" at mount time — anchor for rolling windows (e.g. last N weeks). */
  now: Date;
  /** Start of today (local midnight). */
  today: Date;
  /** Today as "YYYY-MM-DD", for string-date column comparisons. */
  todayISO: string;
  /** Monday of the current week. */
  weekStart: Date;
  /** 1st day of the current month. */
  monthStart: Date;
  /** 1st day of the previous month. */
  prevMonthStart: Date;
  /** Last day of the previous month. */
  prevMonthEnd: Date;
}

/**
 * Date boundaries anchored to "now", computed once per mount instead of
 * once per render. Screens that derive KPIs from these (today/this-week/
 * this-month splits) feed them into `useMemo` deps — a fresh `new Date()`
 * every render would give those memos a new reference every time and
 * silently defeat the cache.
 */
export function useDateBoundaries(): DateBoundaries {
  return useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return {
      now,
      today: startOfDay(now),
      todayISO: now.toISOString().slice(0, 10),
      weekStart: startOfWeek(now, { weekStartsOn: 1 }), // semana começa segunda
      monthStart: new Date(year, month, 1),
      prevMonthStart: new Date(year, month - 1, 1),
      prevMonthEnd: new Date(year, month, 0),
    };
  }, []);
}
