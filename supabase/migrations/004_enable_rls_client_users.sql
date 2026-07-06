-- 004_enable_rls_client_users.sql
-- SEC-02: Enable RLS on client_users with a self-read-only policy.
--
-- Corrects the v1.0 decision that left client_users without RLS. A public-schema
-- table with RLS disabled is fully readable AND writable via PostgREST by any
-- anon/authenticated user, which defeats every other table's client_users subquery.
--
-- The self-read SELECT policy lets a user read only their own mapping, which is
-- exactly what the other policies' subqueries need — there is no circular dependency.
-- Admin writes go through the service role key, which BYPASSES RLS, so NO write
-- policies (INSERT/UPDATE/DELETE) are defined here by design.

alter table public.client_users enable row level security;

create policy "client_users: self read only"
  on public.client_users for select
  using (user_id = (select auth.uid()));
