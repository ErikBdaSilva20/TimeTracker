import { db } from "./client";
import type {
  ClientRow,
  ContactRow,
  GoalRow,
  InvoiceItemRow,
  InvoiceRow,
  MemberRow,
  ProjectRow,
  SettingsRow,
  TagRow,
  TaskRow,
  TimeEntryRow,
  TimeEntryTagRow,
  TimerSessionRow,
  WorkScheduleRow,
} from "./types.gen";

// ─────────────────────────────────────────────────────────────────────────
// Numeric normalization
//
// Postgres `numeric`/`decimal` columns (default_hour_rate, hourly_rate,
// budget, estimated_hours, weekly_goal, monthly_goal, hour_rate,
// total_hours, total_amount, amount) come back from the gateway as JSON
// STRINGS, not numbers — this is the standard node-postgres behavior for
// that type (it avoids silent float precision loss), and `types.gen.ts`
// still types them as `number` because that's the shape the column has
// once you coerce it, not what the wire actually sends.
//
// Multiplying/dividing one of these fields auto-coerces to a number
// (`"180" * 2 === 360`), so most of the app "accidentally" works. But
// directly summing one with `+` does NOT coerce — it does string
// concatenation (`0 + "150.00"` is `"0150.00"`, not `150`). That was a real,
// live bug in the invoice totals on InvoicesScreen (`total`, `paid`,
// `outstanding`): with 2+ invoices the reduce produced a garbled
// multi-decimal string that `Number()` can't parse, silently rendering
// "R$ 0,00" instead of the real total.
//
// Fix: normalize numeric columns to real numbers once, right here, so every
// screen that reads from these repos gets what `types.gen.ts` already
// promises — a real `number` — instead of re-coercing (or forgetting to)
// in each screen.
function normalizeNumeric<T extends object>(row: T, keys: readonly (keyof T)[]): T {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value !== "") {
      (row as Record<string, unknown>)[key as string] = Number(value);
    }
  }
  return row;
}

/**
 * Wraps db.table<T>() and normalizes the given numeric columns on every
 * read (list/create/update responses). Tables with no numeric columns
 * should just use db.table() directly — no need to wrap them.
 */
function tableRepo<T extends object>(name: string, numericKeys: readonly (keyof T)[]) {
  const base = db.table<T>(name);
  return {
    list: async () => (await base.list()).map((row) => normalizeNumeric(row, numericKeys)),
    create: async (input: Partial<T>) => normalizeNumeric(await base.create(input), numericKeys),
    update: async (id: string, patch: Partial<T>) =>
      normalizeNumeric(await base.update(id, patch), numericKeys),
    remove: base.remove,
  };
}

export const clientsRepo = tableRepo<ClientRow>("clients", ["default_hour_rate"]);
export const contactsRepo = db.table<ContactRow>("contacts");
export const projectsRepo = tableRepo<ProjectRow>("projects", [
  "estimated_hours",
  "hourly_rate",
  "budget",
]);
export const tasksRepo = tableRepo<TaskRow>("tasks", ["estimated_hours"]);
export const membersRepo = tableRepo<MemberRow>("members", ["hourly_rate", "weekly_goal"]);
export const workSchedulesRepo = db.table<WorkScheduleRow>("work_schedules");
export const goalsRepo = tableRepo<GoalRow>("goals", ["weekly_goal", "monthly_goal"]);
export const tagsRepo = db.table<TagRow>("tags");
export const timerSessionsRepo = db.table<TimerSessionRow>("timer_sessions");
export const timeEntriesRepo = tableRepo<TimeEntryRow>("time_entries", ["hour_rate"]);
export const timeEntryTagsRepo = db.table<TimeEntryTagRow>("time_entry_tags");
export const invoicesRepo = tableRepo<InvoiceRow>("invoices", ["total_hours", "total_amount"]);
export const invoiceItemsRepo = tableRepo<InvoiceItemRow>("invoice_items", ["amount"]);
export const settingsRepo = tableRepo<SettingsRow>("settings", ["default_hour_rate"]);

export type {
  ClientRow,
  ClientStatus,
  ContactRow,
  GoalRow,
  InvoiceItemRow,
  InvoiceRow,
  InvoiceStatus,
  MemberRow,
  ProjectRow,
  ProjectStatus,
  SettingsRow,
  TagRow,
  TaskRow,
  TaskStatus,
  TimeEntryRow,
  TimeEntryTagRow,
  TimerSessionRow,
  WorkScheduleRow,
} from "./types.gen";
