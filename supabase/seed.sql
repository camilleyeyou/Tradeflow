-- seed.sql
-- Tradeflow development seed data
-- Apply AFTER running 001_initial_schema.sql

-- Test client: Oak Park HVAC
-- Fixed UUID so client_users insert can reference it deterministically
INSERT INTO public.clients (
  id,
  business_name,
  owner_name,
  email,
  phone,
  city,
  state,
  service_area_zips,
  slug,
  plan,
  is_active,
  notifications_enabled
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Oak Park HVAC',
  'Test Owner',
  'owner@oakparkhvac.test',
  '7085550100',
  'Oak Park',
  'IL',
  ARRAY['60301','60302','60303'],
  'oak-park-hvac',
  'starter',
  true,
  true
);

-- Test lead for Oak Park HVAC
INSERT INTO public.leads (
  client_id,
  homeowner_name,
  phone,
  zip_code,
  service_type,
  source,
  status
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Jane Smith',
  '3125550199',
  '60301',
  'ac_repair',
  'landing_page',
  'new'
);

-- NOTE: RLS verification requires a real Supabase Auth user.
-- After running this seed, create a test user in Supabase Auth dashboard
-- (email: testowner@tradeflow.test, password: TestPass123!)
-- and run the INSERT below with their actual auth.uid():

-- INSERT INTO public.client_users (user_id, client_id, role)
-- VALUES ('{AUTH_USER_UUID}', 'a0000000-0000-0000-0000-000000000001', 'owner');
