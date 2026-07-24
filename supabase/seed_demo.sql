-- supabase/seed_demo.sql
-- ============================================================================
-- STANDALONE DEMO DATA SEED — this is NOT a migration. Do not move it into
-- migrations/ and do not run it via the migration runner.
--
-- Purpose: creates a fully-fake, always-fresh "Summit Air & Plumbing (Demo)"
-- client with leads/calls/sms data so sales can demo the dashboard without
-- exposing a real client's data.
--
-- HOW TO RUN:
--   1. Apply ALL migrations through 015_job_value_and_timezone.sql first —
--      this file writes leads.job_value_cents and clients.timezone, which
--      only exist after migration 015.
--   2. Paste this entire file into the Supabase SQL editor (or run via
--      `psql`) and execute it once. Safe to re-run any time — see
--      "Re-runnable" below.
--   3. In the admin dashboard, open this demo client and use the
--      "create login" action to provision a demo dashboard login for the
--      sales call.
--
-- Re-runnable: the first statement deletes any prior demo client by slug.
-- clients.id -> leads.client_id and clients.id -> calls.client_id both
-- cascade on delete, and sms_sequences cascades via leads.id, so re-running
-- this file always starts from a clean slate.
--
-- CRITICAL: is_active = false below is what keeps this client OFF the public
-- landing pages, the sitemap, and the monthly-report cron — all three filter
-- on clients.is_active = true (see app/(landing)/[clientSlug]/page.tsx,
-- app/sitemap.ts, and app/api/cron/monthly-reports/route.ts). Do not flip
-- this to true.
--
-- Every phone number below uses the fake 555 exchange (555-010-0xxx).
-- Nothing here reads as a real business, review, or testimonial.
-- ============================================================================

delete from public.clients where slug = 'demo-summit-air-plumbing';

-- ----------------------------------------------------------------------------
-- Demo client
-- ----------------------------------------------------------------------------
insert into public.clients (
  id, business_name, owner_name, email, phone, city, state,
  service_area_zips, slug, plan, trade, is_active, notifications_enabled,
  review_rating, review_count, google_review_url, timezone
) values (
  'd0000000-0000-0000-0000-000000000001',
  'Summit Air & Plumbing (Demo)',
  'Demo Owner',
  'demo@tradeflow-technologies.com',
  '(555) 010-0100',
  'Chicago',
  'IL',
  ARRAY['60601','60614','60622'],
  'demo-summit-air-plumbing',
  'growth',
  'hvac',
  false, -- CRITICAL: keeps this demo client out of landing pages, sitemap, and monthly reports
  false,
  4.8,
  47,
  'https://g.page/r/demo-example/review',
  'America/Chicago'
);

-- ----------------------------------------------------------------------------
-- Leads (24 total over the last ~30 days, so the demo always looks fresh).
-- 8 leads use fixed ids (...011-...018) so the calls/sms rows below can
-- reference them; the rest use default generated ids.
-- ----------------------------------------------------------------------------
insert into public.leads (
  id, client_id, homeowner_name, phone, zip_code, service_type, source,
  status, created_at, first_contact_at, urgency_score, urgency_reason, job_value_cents
) values
  ('d0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000001', 'Marcus T.',   '(555) 010-0101', '60601', 'ac-repair',      'landing_form', 'new',       now() - interval '4 hours',  null,                                             6, null, null),
  ('d0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000001', 'Sarah K.',    '(555) 010-0102', '60614', 'furnace-repair', 'direct_call',  'new',       now() - interval '10 hours', null,                                             9, 'No heat, elderly resident', null),
  (gen_random_uuid(),                      'd0000000-0000-0000-0000-000000000001', 'David L.',    '(555) 010-0103', '60622', 'installation',   'google_lsa',   'new',       now() - interval '20 hours', null,                                             3, null, null),
  (gen_random_uuid(),                      'd0000000-0000-0000-0000-000000000001', 'Angela P.',   '(555) 010-0104', '60601', 'maintenance',    'landing_form', 'new',       now() - interval '1 day',    null,                                             2, null, null),
  (gen_random_uuid(),                      'd0000000-0000-0000-0000-000000000001', 'Robert C.',   '(555) 010-0105', '60614', 'ac-repair',      'direct_call',  'new',       now() - interval '2 days',   null,                                             5, null, null),

  ('d0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000001', 'Nancy W.',    '(555) 010-0106', '60622', 'furnace-repair', 'google_lsa',   'contacted', now() - interval '3 days',   now() - interval '3 days' + interval '5 minutes', 8, 'No heat, family with infant', null),
  ('d0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000001', 'Kevin B.',    '(555) 010-0107', '60601', 'installation',   'landing_form', 'contacted', now() - interval '4 days',   now() - interval '4 days' + interval '7 minutes', 4, null, null),
  (gen_random_uuid(),                      'd0000000-0000-0000-0000-000000000001', 'Michelle R.', '(555) 010-0108', '60614', 'maintenance',    'direct_call',  'contacted', now() - interval '5 days',   now() - interval '5 days' + interval '3 minutes', 3, null, null),
  (gen_random_uuid(),                      'd0000000-0000-0000-0000-000000000001', 'James O.',    '(555) 010-0109', '60622', 'ac-repair',      'google_lsa',   'contacted', now() - interval '6 days',   now() - interval '6 days' + interval '6 minutes', 6, null, null),
  (gen_random_uuid(),                      'd0000000-0000-0000-0000-000000000001', 'Linda F.',    '(555) 010-0110', '60601', 'furnace-repair', 'landing_form', 'contacted', now() - interval '7 days',   now() - interval '7 days' + interval '4 minutes', 2, null, null),

  ('d0000000-0000-0000-0000-000000000015', 'd0000000-0000-0000-0000-000000000001', 'Steven G.',   '(555) 010-0111', '60614', 'installation',   'direct_call',  'booked',    now() - interval '8 days',   now() - interval '8 days' + interval '8 minutes', 7, null, null),
  ('d0000000-0000-0000-0000-000000000016', 'd0000000-0000-0000-0000-000000000001', 'Patricia N.', '(555) 010-0112', '60622', 'maintenance',    'google_lsa',   'booked',    now() - interval '9 days',   now() - interval '9 days' + interval '5 minutes', 3, null, null),
  (gen_random_uuid(),                      'd0000000-0000-0000-0000-000000000001', 'Brian H.',    '(555) 010-0113', '60601', 'ac-repair',      'landing_form', 'booked',    now() - interval '10 days',  now() - interval '10 days' + interval '6 minutes', 5, null, null),
  (gen_random_uuid(),                      'd0000000-0000-0000-0000-000000000001', 'Karen S.',    '(555) 010-0114', '60614', 'furnace-repair', 'direct_call',  'booked',    now() - interval '11 days',  now() - interval '11 days' + interval '4 minutes', 9, 'No heat, elderly couple', null),
  (gen_random_uuid(),                      'd0000000-0000-0000-0000-000000000001', 'Daniel M.',   '(555) 010-0115', '60622', 'installation',   'google_lsa',   'booked',    now() - interval '12 days',  now() - interval '12 days' + interval '9 minutes', 4, null, null),

  ('d0000000-0000-0000-0000-000000000017', 'd0000000-0000-0000-0000-000000000001', 'Susan A.',    '(555) 010-0116', '60601', 'maintenance',    'landing_form', 'completed', now() - interval '13 days',  now() - interval '13 days' + interval '5 minutes', 3, null, 42000),
  ('d0000000-0000-0000-0000-000000000018', 'd0000000-0000-0000-0000-000000000001', 'Mark D.',     '(555) 010-0117', '60614', 'ac-repair',      'direct_call',  'completed', now() - interval '14 days',  now() - interval '14 days' + interval '6 minutes', 6, null, 385000),
  (gen_random_uuid(),                      'd0000000-0000-0000-0000-000000000001', 'Laura E.',    '(555) 010-0118', '60622', 'furnace-repair', 'google_lsa',   'completed', now() - interval '15 days',  now() - interval '15 days' + interval '4 minutes', 2, null, 120000),
  (gen_random_uuid(),                      'd0000000-0000-0000-0000-000000000001', 'Paul V.',     '(555) 010-0119', '60601', 'installation',   'landing_form', 'completed', now() - interval '17 days',  now() - interval '17 days' + interval '7 minutes', 4, null, 65000),
  (gen_random_uuid(),                      'd0000000-0000-0000-0000-000000000001', 'Donna Y.',    '(555) 010-0120', '60614', 'maintenance',    'direct_call',  'completed', now() - interval '19 days',  now() - interval '19 days' + interval '5 minutes', 3, null, 420000),
  (gen_random_uuid(),                      'd0000000-0000-0000-0000-000000000001', 'Timothy Q.',  '(555) 010-0121', '60622', 'ac-repair',      'google_lsa',   'completed', now() - interval '21 days',  now() - interval '21 days' + interval '6 minutes', 5, null, 89000),
  (gen_random_uuid(),                      'd0000000-0000-0000-0000-000000000001', 'Carol J.',    '(555) 010-0122', '60601', 'furnace-repair', 'landing_form', 'completed', now() - interval '23 days',  now() - interval '23 days' + interval '4 minutes', 7, null, null),

  (gen_random_uuid(),                      'd0000000-0000-0000-0000-000000000001', 'Gary Z.',     '(555) 010-0123', '60614', 'installation',   'direct_call',  'lost',      now() - interval '25 days',  now() - interval '25 days' + interval '9 minutes', 2, null, null),
  (gen_random_uuid(),                      'd0000000-0000-0000-0000-000000000001', 'Betty X.',    '(555) 010-0124', '60622', 'maintenance',    'google_lsa',   'lost',      now() - interval '28 days',  now() - interval '28 days' + interval '10 minutes', 1, null, null);

-- ----------------------------------------------------------------------------
-- Calls (14 total). About half reference the fixed-id leads above; the rest
-- are unlinked, which mirrors real traffic — not every call becomes a lead.
-- ----------------------------------------------------------------------------
insert into public.calls (
  client_id, lead_id, caller_number, tracking_number, duration_seconds, outcome, called_at
) values
  ('d0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000011', '(555) 010-0101', '(555) 010-0199', 245, 'answered',  now() - interval '4 hours'),
  ('d0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000012', '(555) 010-0102', '(555) 010-0199', 0,   'missed',    now() - interval '10 hours'),
  ('d0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000013', '(555) 010-0106', '(555) 010-0199', 35,  'voicemail', now() - interval '3 days'),
  ('d0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000014', '(555) 010-0107', '(555) 010-0199', 180, 'answered',  now() - interval '4 days'),
  ('d0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000015', '(555) 010-0111', '(555) 010-0199', 420, 'answered',  now() - interval '8 days'),
  ('d0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000016', '(555) 010-0112', '(555) 010-0199', 0,   'missed',    now() - interval '9 days'),
  ('d0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000017', '(555) 010-0116', '(555) 010-0199', 50,  'voicemail', now() - interval '13 days'),
  ('d0000000-0000-0000-0000-000000000001', null, '(555) 010-0131', '(555) 010-0199', 300, 'answered',  now() - interval '1 day'),
  ('d0000000-0000-0000-0000-000000000001', null, '(555) 010-0132', '(555) 010-0199', 0,   'missed',    now() - interval '2 days'),
  ('d0000000-0000-0000-0000-000000000001', null, '(555) 010-0133', '(555) 010-0199', 150, 'answered',  now() - interval '5 days'),
  ('d0000000-0000-0000-0000-000000000001', null, '(555) 010-0134', '(555) 010-0199', 60,  'voicemail', now() - interval '6 days'),
  ('d0000000-0000-0000-0000-000000000001', null, '(555) 010-0135', '(555) 010-0199', 0,   'missed',    now() - interval '11 days'),
  ('d0000000-0000-0000-0000-000000000001', null, '(555) 010-0136', '(555) 010-0199', 500, 'answered',  now() - interval '16 days'),
  ('d0000000-0000-0000-0000-000000000001', null, '(555) 010-0137', '(555) 010-0199', 90,  'answered',  now() - interval '20 days');

-- ----------------------------------------------------------------------------
-- SMS follow-up sequence rows (a handful, referencing fixed-id leads).
-- ----------------------------------------------------------------------------
insert into public.sms_sequences (
  lead_id, touch_number, message_body, status, scheduled_at, sent_at
) values
  ('d0000000-0000-0000-0000-000000000011', 1, 'Hi Marcus, thanks for reaching out to Summit Air & Plumbing! We got your AC repair request and will call you shortly.', 'sent', now() - interval '4 hours' + interval '2 minutes', now() - interval '4 hours' + interval '2 minutes'),
  ('d0000000-0000-0000-0000-000000000012', 1, 'Hi Sarah, we marked your furnace repair request urgent — a technician will call within 15 minutes.', 'sent', now() - interval '10 hours' + interval '2 minutes', now() - interval '10 hours' + interval '2 minutes'),
  ('d0000000-0000-0000-0000-000000000013', 2, 'Just checking in — still interested in scheduling your furnace repair? Reply YES to confirm a time.', 'pending', now() + interval '1 day', null),
  ('d0000000-0000-0000-0000-000000000017', 3, 'Thanks again for choosing Summit Air & Plumbing! If we did a great job, we''d love a quick Google review: https://g.page/r/demo-example/review', 'sent', now() - interval '13 days' + interval '30 minutes', now() - interval '13 days' + interval '30 minutes');
