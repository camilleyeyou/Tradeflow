-- 009_schema_integrity.sql
-- HARD-03: schema integrity — CHECK constraints on enum-like columns,
-- missing indexes for common lookup patterns, and updated_at bookkeeping.
-- The leads CallRail-call-id unique index already exists (migration 005,
-- MISS-02) and is intentionally NOT recreated here.

-- ---------------------------------------------------------------------------
-- 1. CHECK constraints — reject out-of-enum values at write time.
--    NULLs pass automatically for nullable columns (calls.outcome).
-- ---------------------------------------------------------------------------
alter table public.leads
  add constraint leads_status_check
  check (status in ('new', 'contacted', 'booked', 'completed', 'lost'));

alter table public.sms_sequences
  add constraint sms_sequences_status_check
  check (status in ('pending', 'sent', 'stopped', 'failed'));

alter table public.billing
  add constraint billing_status_check
  check (status in ('paid', 'open', 'void', 'uncollectible', 'draft', 'failed'));

alter table public.calls
  add constraint calls_outcome_check
  check (outcome in ('missed', 'answered', 'voicemail', 'abandoned', 'completed'));

alter table public.clients
  add constraint clients_plan_check
  check (plan in ('starter', 'growth', 'premium'));

-- ---------------------------------------------------------------------------
-- 2. Indexes for common lookup patterns not already covered by migration 001
--    or 005. Do NOT recreate the leads CallRail-call-id unique index — see 005.
-- ---------------------------------------------------------------------------
create index if not exists billing_client_id_idx on public.billing(client_id);
create index if not exists leads_ghl_contact_id_idx on public.leads(ghl_contact_id);
create index if not exists calls_lead_id_idx on public.calls(lead_id);

-- ---------------------------------------------------------------------------
-- 3. updated_at columns + shared trigger function on clients, leads,
--    sms_sequences.
-- ---------------------------------------------------------------------------
alter table public.clients       add column if not exists updated_at timestamptz not null default now();
alter table public.leads         add column if not exists updated_at timestamptz not null default now();
alter table public.sms_sequences add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_clients on public.clients;
create trigger set_updated_at_clients
  before update on public.clients
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_leads on public.leads;
create trigger set_updated_at_leads
  before update on public.leads
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_sms_sequences on public.sms_sequences;
create trigger set_updated_at_sms_sequences
  before update on public.sms_sequences
  for each row execute function public.set_updated_at();
