-- 007_add_reviews_to_clients.sql
-- Per-client review rating/count for landing-page trust block (LEGL-03). Null = hidden.
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS review_rating numeric(2,1);
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS review_count integer;
