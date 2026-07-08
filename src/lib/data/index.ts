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

export const clientsRepo = db.table<ClientRow>("clients");
export const contactsRepo = db.table<ContactRow>("contacts");
export const projectsRepo = db.table<ProjectRow>("projects");
export const tasksRepo = db.table<TaskRow>("tasks");
export const membersRepo = db.table<MemberRow>("members");
export const workSchedulesRepo = db.table<WorkScheduleRow>("work_schedules");
export const goalsRepo = db.table<GoalRow>("goals");
export const tagsRepo = db.table<TagRow>("tags");
export const timerSessionsRepo = db.table<TimerSessionRow>("timer_sessions");
export const timeEntriesRepo = db.table<TimeEntryRow>("time_entries");
export const timeEntryTagsRepo = db.table<TimeEntryTagRow>("time_entry_tags");
export const invoicesRepo = db.table<InvoiceRow>("invoices");
export const invoiceItemsRepo = db.table<InvoiceItemRow>("invoice_items");
export const settingsRepo = db.table<SettingsRow>("settings");

export type {
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
