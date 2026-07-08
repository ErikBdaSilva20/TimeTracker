import type { TimeEntryRow } from "./data";

/**
 * Billable revenue for a single time entry: hours × hour_rate, zeroed out
 * for non-billable entries.
 *
 * Centralized here because this exact formula was independently
 * reimplemented in 9 places across 5 screens (Dashboard, Analytics,
 * Reports, Invoices, Team) — any future change to the billing rule
 * (rounding, tax, a different definition of "billable") only needs to
 * happen once instead of risking one screen drifting from the others.
 */
export function calculateRevenue(
  entry: Pick<TimeEntryRow, "duration_minutes" | "hour_rate" | "billable">,
): number {
  if (!entry.billable) return 0;
  return (entry.duration_minutes / 60) * (entry.hour_rate || 0);
}
