-- 011_add_first_contact_at.sql -- ROI-01: time-to-first-contact
-- Records the first time a lead moves off status 'new'. Stamped once (earliest
-- touch wins) by updateLeadStatus in apps/web/src/lib/actions/lead-actions.ts.
-- Used to compute average speed-to-lead for the ROI dashboard summary (ROI-02).

alter table public.leads add column if not exists first_contact_at timestamptz;
