-- 0003_settings_default_locale.sql
-- The app is BRL/pt-BR only (see src/lib/format.ts), but `settings` defaulted
-- to USD/UTC — a tenant seeded by the gateway on first sign-up (before ever
-- saving the Settings screen) got a currency/timezone that disagrees with
-- what the rest of the app already assumes (audit 4.3).

alter table settings
  alter column currency set default 'BRL',
  alter column timezone set default 'America/Sao_Paulo';

-- Backfill rows seeded before this migration that were never edited by hand.
update settings set currency = 'BRL' where currency = 'USD';
update settings set timezone = 'America/Sao_Paulo' where timezone = 'UTC';
