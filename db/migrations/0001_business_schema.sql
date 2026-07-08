-- 0001_business_schema.sql
-- Portable Postgres schema for TimeFlow (Neon / Supabase compatible).
-- Assumes a Better-Auth "user" table already exists in the tenant database.
-- No RLS, no auth.uid(), no procedures — business rules live in the app.

create extension if not exists "pgcrypto";

-- clients
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null references "user"(id) on delete cascade,
  name text not null,
  company text,
  email text,
  phone text,
  website text,
  default_hour_rate numeric,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_clients_owner on clients(owner_id);

-- contacts
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null references "user"(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  name text not null,
  role text,
  department text,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_contacts_owner on contacts(owner_id);
create index if not exists idx_contacts_client on contacts(client_id);

-- projects
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null references "user"(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  name text not null,
  description text,
  color text,
  status text not null default 'active',
  start_date date,
  end_date date,
  estimated_hours numeric,
  hourly_rate numeric,
  budget numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_projects_owner on projects(owner_id);
create index if not exists idx_projects_client on projects(client_id);

-- members
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null references "user"(id) on delete cascade,
  name text not null,
  email text,
  role text,
  hourly_rate numeric,
  weekly_goal numeric,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_members_owner on members(owner_id);

-- tasks
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null references "user"(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  description text,
  priority text,
  status text,
  estimated_hours numeric,
  member_id uuid references members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_tasks_owner on tasks(owner_id);
create index if not exists idx_tasks_project on tasks(project_id);

-- work_schedules
create table if not exists work_schedules (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null references "user"(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  weekday int,
  start_time time,
  end_time time,
  break_minutes int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- goals
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null references "user"(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  weekly_goal numeric,
  monthly_goal numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- tags
create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null references "user"(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- timer_sessions
create table if not exists timer_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null references "user"(id) on delete cascade,
  member_id uuid references members(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  task_id uuid references tasks(id) on delete set null,
  description text,
  started_at timestamptz,
  paused_at timestamptz,
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- time_entries (central)
create table if not exists time_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null references "user"(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  task_id uuid references tasks(id) on delete set null,
  member_id uuid references members(id) on delete set null,
  date date not null,
  start_time timestamptz,
  end_time timestamptz,
  duration_minutes int not null,
  billable boolean not null default true,
  notes text,
  client_name text,
  project_name text,
  task_name text,
  member_name text,
  hour_rate numeric,
  currency text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_time_entries_owner on time_entries(owner_id);
create index if not exists idx_time_entries_project on time_entries(project_id);
create index if not exists idx_time_entries_date on time_entries(date);

-- time_entry_tags (N:N)
create table if not exists time_entry_tags (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null references "user"(id) on delete cascade,
  time_entry_id uuid not null references time_entries(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- invoices
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null references "user"(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  invoice_number text not null,
  period_start date,
  period_end date,
  total_hours numeric,
  total_amount numeric,
  status text not null default 'draft',
  issued_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- invoice_items
create table if not exists invoice_items (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null references "user"(id) on delete cascade,
  invoice_id uuid not null references invoices(id) on delete cascade,
  time_entry_id uuid references time_entries(id) on delete set null,
  amount numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- settings
create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null references "user"(id) on delete cascade,
  currency text not null default 'USD',
  timezone text not null default 'UTC',
  default_hour_rate numeric,
  workdays jsonb,
  date_format text,
  timer_preferences jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
