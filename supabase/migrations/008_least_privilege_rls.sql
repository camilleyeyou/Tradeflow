-- 008_least_privilege_rls.sql
-- HARD-02: least-privilege RLS.
-- Today, leads/calls/sms_sequences use permissive all-command policies, which
-- grant clients INSERT/DELETE they never need (all writes to these tables
-- are made by the service role from FastAPI/Server Actions). Replace with
-- SELECT + scoped UPDATE only. clients gets a column-scoped UPDATE grant
-- since RLS row policies cannot restrict which columns are writable.

-- ---------------------------------------------------------------------------
-- 1. clients — column-scoped UPDATE grant
--    RLS (migrations 001/003) already restricts which ROWS can be updated;
--    this restricts which COLUMNS can be updated within those rows.
-- ---------------------------------------------------------------------------
revoke update on public.clients from authenticated;
grant update (business_name, phone, email, city, notifications_enabled, review_rating, review_count)
  on public.clients to authenticated;

-- ---------------------------------------------------------------------------
-- 2. leads — drop the permissive all-command policy, add SELECT + scoped
--    UPDATE (no INSERT/DELETE)
-- ---------------------------------------------------------------------------
drop policy if exists "leads: owner sees own leads" on public.leads;

create policy "leads: owner can read own leads"
  on public.leads for select
  using (
    client_id in (
      select client_id from public.client_users
      where user_id = auth.uid()
    )
  );

create policy "leads: owner can update own leads"
  on public.leads for update
  using (
    client_id in (
      select client_id from public.client_users
      where user_id = auth.uid()
    )
  )
  with check (
    client_id in (
      select client_id from public.client_users
      where user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 3. calls — drop the permissive all-command policy, add SELECT + scoped
--    UPDATE (no INSERT/DELETE)
-- ---------------------------------------------------------------------------
drop policy if exists "calls: owner sees own calls" on public.calls;

create policy "calls: owner can read own calls"
  on public.calls for select
  using (
    client_id in (
      select client_id from public.client_users
      where user_id = auth.uid()
    )
  );

create policy "calls: owner can update own calls"
  on public.calls for update
  using (
    client_id in (
      select client_id from public.client_users
      where user_id = auth.uid()
    )
  )
  with check (
    client_id in (
      select client_id from public.client_users
      where user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 4. sms_sequences — drop the permissive all-command policy, add SELECT +
--    scoped UPDATE via 2-hop join (lead_id -> leads.client_id -> client_users)
-- ---------------------------------------------------------------------------
drop policy if exists "sms_sequences: owner sees own sequences" on public.sms_sequences;

create policy "sms_sequences: owner can read own sequences"
  on public.sms_sequences for select
  using (
    lead_id in (
      select id from public.leads
      where client_id in (
        select client_id from public.client_users
        where user_id = auth.uid()
      )
    )
  );

create policy "sms_sequences: owner can update own sequences"
  on public.sms_sequences for update
  using (
    lead_id in (
      select id from public.leads
      where client_id in (
        select client_id from public.client_users
        where user_id = auth.uid()
      )
    )
  )
  with check (
    lead_id in (
      select id from public.leads
      where client_id in (
        select client_id from public.client_users
        where user_id = auth.uid()
      )
    )
  );

-- Note: no INSERT or DELETE policies are added for leads/calls/sms_sequences.
-- All writes of that shape are performed by the service role (FastAPI
-- webhooks, admin Server Actions), which bypasses RLS entirely. billing and
-- client_users policies are untouched by this migration.
