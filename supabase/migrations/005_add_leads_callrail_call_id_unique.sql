-- 005_add_leads_callrail_call_id_unique.sql
-- MISS-02: race-safe dedup of missed-call leads on the CallRail call id.
-- Partial unique index (NULLs allowed) so form-sourced leads without a
-- callrail_call_id are unaffected. (Broader schema integrity work is Phase 7 HARD-03.)
create unique index if not exists leads_callrail_call_id_unique
  on public.leads (callrail_call_id)
  where callrail_call_id is not null;
