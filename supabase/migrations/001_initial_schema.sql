-- 001_initial_schema.sql
-- Tradeflow initial schema: all 6 tables, RLS, policies, indexes

-- clients: one row per HVAC company we manage
create table public.clients (
  id                       uuid primary key default gen_random_uuid(),
  business_name            text not null,
  owner_name               text not null,
  email                    text not null unique,
  phone                    text not null,
  city                     text not null,
  state                    text not null default 'IL',
  service_area_zips        text[] not null default '{}',
  ghl_sub_account_id       text,
  callrail_tracking_number text,
  stripe_customer_id       text,
  stripe_subscription_id   text,
  plan                     text not null default 'starter',
  is_active                boolean not null default true,
  trial_ends_at            timestamptz,
  created_at               timestamptz not null default now()
);

-- leads: one row per inbound lead for any client
create table public.leads (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references public.clients(id) on delete cascade,
  homeowner_name   text,
  phone            text,
  email            text,
  zip_code         text,
  service_type     text,
  source           text,
  status           text not null default 'new',
  lead_score       int,
  notes            text,
  ghl_contact_id   text,
  callrail_call_id text,
  created_at       timestamptz not null default now(),
  contacted_at     timestamptz,
  booked_at        timestamptz,
  completed_at     timestamptz
);

-- calls: every inbound call tracked via CallRail
create table public.calls (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references public.clients(id) on delete cascade,
  lead_id          uuid references public.leads(id),
  callrail_call_id text unique,
  caller_number    text,
  tracking_number  text,
  duration_seconds int,
  recording_url    text,
  transcript       text,
  outcome          text,
  called_at        timestamptz not null default now()
);

-- sms_sequences: tracks each touch in the follow-up sequence
create table public.sms_sequences (
  id             uuid primary key default gen_random_uuid(),
  lead_id        uuid not null references public.leads(id) on delete cascade,
  touch_number   int not null,
  message_body   text not null,
  ghl_message_id text,
  status         text not null default 'pending',
  scheduled_at   timestamptz not null,
  sent_at        timestamptz
);

-- billing: Stripe invoice records
create table public.billing (
  id                     uuid primary key default gen_random_uuid(),
  client_id              uuid not null references public.clients(id) on delete cascade,
  stripe_invoice_id      text unique,
  stripe_subscription_id text,
  amount_cents           int not null,
  currency               text not null default 'usd',
  status                 text not null,
  period_start           timestamptz,
  period_end             timestamptz,
  paid_at                timestamptz,
  created_at             timestamptz not null default now()
);

-- client_users: join table mapping auth.uid() to client_id for RLS
-- No RLS on this table — it is the identity source used by all other policies
create table public.client_users (
  user_id   uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  role      text not null default 'owner',
  primary key (user_id, client_id)
);

-- Enable Row Level Security on all tables EXCEPT client_users
-- client_users has no RLS — it is the identity mapping source
alter table public.clients       enable row level security;
alter table public.leads         enable row level security;
alter table public.calls         enable row level security;
alter table public.sms_sequences enable row level security;
alter table public.billing       enable row level security;

-- RLS policies: HVAC owners see only their own client row + related data
-- The client's auth.uid() maps to clients.id via the client_users join table

create policy "clients: owner can read own record"
  on public.clients for select
  using (
    id in (
      select client_id from public.client_users
      where user_id = auth.uid()
    )
  );

create policy "leads: owner sees own leads"
  on public.leads for all
  using (
    client_id in (
      select client_id from public.client_users
      where user_id = auth.uid()
    )
  );

create policy "calls: owner sees own calls"
  on public.calls for all
  using (
    client_id in (
      select client_id from public.client_users
      where user_id = auth.uid()
    )
  );

create policy "billing: owner sees own billing"
  on public.billing for select
  using (
    client_id in (
      select client_id from public.client_users
      where user_id = auth.uid()
    )
  );

-- sms_sequences policy: ownership resolved through leads → client_users
-- Note: this policy was missing from the original spec — added per RESEARCH.md Pitfall 6
create policy "sms_sequences: owner sees own sequences"
  on public.sms_sequences for all
  using (
    lead_id in (
      select id from public.leads
      where client_id in (
        select client_id from public.client_users
        where user_id = auth.uid()
      )
    )
  );

-- Indexes for performance
create index leads_client_id_idx     on public.leads(client_id);
create index leads_status_idx        on public.leads(status);
create index leads_created_at_idx    on public.leads(created_at desc);
create index calls_client_id_idx     on public.calls(client_id);
create index sms_lead_id_idx         on public.sms_sequences(lead_id);
