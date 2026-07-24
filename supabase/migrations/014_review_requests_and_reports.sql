-- 014_review_requests_and_reports.sql -- Google review requests + monthly ROI report support
alter table public.clients add column if not exists google_review_url text;
alter table public.clients add column if not exists review_requests_enabled boolean not null default true;
alter table public.leads add column if not exists review_requested_at timestamptz;

-- Extend the migration-008 column-scoped UPDATE grant so clients can set their
-- Google review URL and toggle review requests from the dashboard settings form.
grant update (google_review_url, review_requests_enabled) on public.clients to authenticated;
