-- 010_webhook_events.sql -- DUR-01: durable webhook event log + dedup + replay
-- Every FastAPI webhook handler (Stripe, GHL, CallRail) durably records the
-- raw provider event here BEFORE returning 200. UNIQUE(provider,
-- provider_event_id) makes redelivery a no-op. A stored row can be replayed
-- on demand via scripts/replay_webhook_event.py.

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('stripe', 'ghl', 'callrail')),
  provider_event_id text not null,
  event_type text,
  payload jsonb not null,
  signature_verified boolean not null default false,
  status text not null default 'received' check (status in ('received','processed','failed')),
  error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, provider_event_id)
);

-- RLS enabled with NO policies added — service role bypasses RLS for all
-- inserts/updates from FastAPI; anon/authenticated get deny-all by default
-- (service-role only, per DUR-01 decision in 09-CONTEXT.md).
alter table public.webhook_events enable row level security;

create index if not exists webhook_events_provider_status_idx on public.webhook_events(provider, status);
