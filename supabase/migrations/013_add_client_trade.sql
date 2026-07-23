-- 013_add_client_trade.sql -- TRADE-DB: expand Tradeflow from HVAC-only to HVAC + plumbing
-- Adds clients.trade so each client can be flagged as 'hvac' or 'plumbing'.
-- NOT NULL with a DEFAULT of 'hvac' backfills every existing row to 'hvac',
-- so existing HVAC clients' landing pages, scoring, and dashboards are
-- completely unaffected by this migration.

alter table public.clients add column if not exists trade text not null default 'hvac';
alter table public.clients add constraint clients_trade_check check (trade in ('hvac','plumbing'));
