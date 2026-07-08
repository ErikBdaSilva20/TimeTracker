import { useMemo } from "react";
import { calculateRevenue } from "@/lib/billing";
import type { TimeEntryRow } from "@/lib/data";

export interface MemberStats {
  today: number;
  week: number;
  month: number;
  revenue: number;
  projects: Set<string>;
  entries: TimeEntryRow[];
  weekByDay: number[]; // 0..6 (seg..dom) minutes
}

/** Fresh zero-value stats for a member with no time entries yet. */
export function zeroMemberStats(): MemberStats {
  return { today: 0, week: 0, month: 0, revenue: 0, projects: new Set(), entries: [], weekByDay: [0, 0, 0, 0, 0, 0, 0] };
}

/** Aggregates `time_entries` per member into today/week/month totals, revenue and a weekly-by-day breakdown. */
export function usePerMemberStats(
  entries: TimeEntryRow[],
  bounds: { today: Date; weekStart: Date; monthStart: Date },
): Map<string, MemberStats> {
  const { today, weekStart, monthStart } = bounds;
  return useMemo(() => {
    const map = new Map<string, MemberStats>();
    for (const e of entries) {
      const key = e.member_id || "";
      if (!key) continue;
      let cur = map.get(key);
      if (!cur) {
        cur = zeroMemberStats();
        map.set(key, cur);
      }
      const d = new Date(e.date);
      if (d >= today) cur.today += e.duration_minutes;
      if (d >= weekStart) {
        cur.week += e.duration_minutes;
        const idx = (d.getDay() + 6) % 7;
        cur.weekByDay[idx] += e.duration_minutes;
      }
      if (d >= monthStart) {
        cur.month += e.duration_minutes;
        cur.revenue += calculateRevenue(e);
      }
      cur.entries.push(e);
      if (e.project_name) cur.projects.add(e.project_name);
    }
    return map;
  }, [entries, today, weekStart, monthStart]);
}
