-- 015_job_value_and_timezone.sql -- DEMO-SEED support + real job-value
-- tracking (JOB-VALUE) + per-client timezone (CLIENT-TZ). Idempotent: safe
-- to re-run.

alter table public.leads add column if not exists job_value_cents integer;

-- Guarded so re-runs never error (012's bare `add constraint` is NOT
-- re-runnable — do not copy that pattern).
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'leads_job_value_cents_check') then
    alter table public.leads
      add constraint leads_job_value_cents_check
      check (job_value_cents is null or job_value_cents >= 0);
  end if;
end $$;

alter table public.clients add column if not exists timezone text not null default 'America/Chicago';

-- Extend the migration-008 column-scoped UPDATE grant so owners can set
-- their timezone from the dashboard settings form.
grant update (timezone) on public.clients to authenticated;
