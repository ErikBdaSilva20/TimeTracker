-- 0002_timer_session_accumulated_seconds.sql
-- Adds the column timer persistence needs to survive pause/resume cycles
-- across reloads without reconstructing elapsed time from timestamp math
-- alone (audit 4.1 — timer had no persistence at all before this).

alter table timer_sessions
  add column if not exists accumulated_seconds integer not null default 0;
