-- 012_add_urgency.sql -- AI-01: Claude urgency score + reason
-- Adds a 1-10 urgency score and short reason, written by a background
-- claude-fable-5 call triggered from the lead-submit route's after() block
-- (apps/web/src/lib/scoring.ts). Both columns are nullable: scoring is
-- best-effort and skipped entirely when ANTHROPIC_API_KEY is unset.

alter table public.leads add column if not exists urgency_score int;
alter table public.leads add column if not exists urgency_reason text;
alter table public.leads add constraint leads_urgency_score_check
  check (urgency_score is null or (urgency_score between 1 and 10));
