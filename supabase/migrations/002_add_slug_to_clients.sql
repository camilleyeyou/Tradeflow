-- 002_add_slug_to_clients.sql
-- Add slug column for landing page URL routing: /[clientSlug]/[service]

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Backfill existing rows: derive slug from business_name
-- lowercase, replace non-alphanumeric with hyphens, trim trailing hyphens
UPDATE public.clients
SET slug = trim(both '-' from regexp_replace(lower(business_name), '[^a-z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Make slug required for all future inserts
ALTER TABLE public.clients ALTER COLUMN slug SET NOT NULL;
