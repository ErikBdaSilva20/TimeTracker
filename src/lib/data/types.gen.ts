// PROTECTED — schema mirror. Regenerated when the schema changes.

export type ProjectStatus = "active" | "paused" | "completed" | "archived";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type ClientStatus = "active" | "inactive" | "archived";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";
export type TimerStatus = "running" | "paused" | "stopped";

interface Timestamps {
  id: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface ClientRow extends Timestamps {
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  default_hour_rate: number | null;
  status: ClientStatus;
  notes: string | null;
}

export interface ContactRow extends Timestamps {
  client_id: string | null;
  name: string;
  role: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
}

export interface ProjectRow extends Timestamps {
  client_id: string | null;
  name: string;
  description: string | null;
  color: string | null;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  estimated_hours: number | null;
  hourly_rate: number | null;
  budget: number | null;
}

export interface TaskRow extends Timestamps {
  project_id: string | null;
  name: string;
  description: string | null;
  priority: TaskPriority | null;
  status: TaskStatus | null;
  estimated_hours: number | null;
  member_id: string | null;
}

export interface MemberRow extends Timestamps {
  name: string;
  email: string | null;
  role: string | null;
  hourly_rate: number | null;
  weekly_goal: number | null;
  active: boolean;
}

export interface WorkScheduleRow extends Timestamps {
  member_id: string | null;
  weekday: number;
  start_time: string | null;
  end_time: string | null;
  break_minutes: number | null;
}

export interface GoalRow extends Timestamps {
  member_id: string | null;
  weekly_goal: number | null;
  monthly_goal: number | null;
}

export interface TagRow extends Timestamps {
  name: string;
  color: string | null;
}

export interface TimerSessionRow extends Timestamps {
  member_id: string | null;
  project_id: string | null;
  task_id: string | null;
  description: string | null;
  started_at: string | null;
  paused_at: string | null;
  status: TimerStatus;
  /** Seconds banked from prior running segments, excluding the one in progress. */
  accumulated_seconds: number;
}

export interface TimeEntryRow extends Timestamps {
  client_id: string | null;
  project_id: string | null;
  task_id: string | null;
  member_id: string | null;
  date: string;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number;
  billable: boolean;
  notes: string | null;
  // Snapshot fields (preserve history, avoid joins)
  client_name: string | null;
  project_name: string | null;
  task_name: string | null;
  member_name: string | null;
  hour_rate: number | null;
  currency: string | null;
}

export interface TimeEntryTagRow extends Timestamps {
  time_entry_id: string;
  tag_id: string;
}

export interface InvoiceRow extends Timestamps {
  client_id: string | null;
  invoice_number: string;
  period_start: string | null;
  period_end: string | null;
  total_hours: number | null;
  total_amount: number | null;
  status: InvoiceStatus;
  issued_at: string | null;
}

export interface InvoiceItemRow extends Timestamps {
  invoice_id: string;
  time_entry_id: string | null;
  amount: number;
}

export interface SettingsRow extends Timestamps {
  currency: string;
  timezone: string;
  default_hour_rate: number | null;
  workdays: number[];
  date_format: string;
  timer_preferences: Record<string, unknown> | null;
}

// owner_id is set server-side by the gateway; keep it optional on writes.
type Insert<T> = Partial<Omit<T, "id" | "created_at" | "updated_at">>;
type Update<T> = Partial<Omit<T, "id" | "created_at" | "updated_at">>;

export interface Database {
  public: {
    Tables: {
      clients: { Row: ClientRow; Insert: Insert<ClientRow>; Update: Update<ClientRow> };
      contacts: { Row: ContactRow; Insert: Insert<ContactRow>; Update: Update<ContactRow> };
      projects: { Row: ProjectRow; Insert: Insert<ProjectRow>; Update: Update<ProjectRow> };
      tasks: { Row: TaskRow; Insert: Insert<TaskRow>; Update: Update<TaskRow> };
      members: { Row: MemberRow; Insert: Insert<MemberRow>; Update: Update<MemberRow> };
      work_schedules: {
        Row: WorkScheduleRow;
        Insert: Insert<WorkScheduleRow>;
        Update: Update<WorkScheduleRow>;
      };
      goals: { Row: GoalRow; Insert: Insert<GoalRow>; Update: Update<GoalRow> };
      tags: { Row: TagRow; Insert: Insert<TagRow>; Update: Update<TagRow> };
      timer_sessions: {
        Row: TimerSessionRow;
        Insert: Insert<TimerSessionRow>;
        Update: Update<TimerSessionRow>;
      };
      time_entries: {
        Row: TimeEntryRow;
        Insert: Insert<TimeEntryRow>;
        Update: Update<TimeEntryRow>;
      };
      time_entry_tags: {
        Row: TimeEntryTagRow;
        Insert: Insert<TimeEntryTagRow>;
        Update: Update<TimeEntryTagRow>;
      };
      invoices: { Row: InvoiceRow; Insert: Insert<InvoiceRow>; Update: Update<InvoiceRow> };
      invoice_items: {
        Row: InvoiceItemRow;
        Insert: Insert<InvoiceItemRow>;
        Update: Update<InvoiceItemRow>;
      };
      settings: { Row: SettingsRow; Insert: Insert<SettingsRow>; Update: Update<SettingsRow> };
    };
  };
}
