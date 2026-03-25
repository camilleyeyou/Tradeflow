-- Migration 003: Add notifications_enabled to clients table
-- Required by Phase 3 settings page (D-45)
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS notifications_enabled boolean NOT NULL DEFAULT true;

-- Add UPDATE policy so HVAC owners can update their own client record via Server Actions
-- Without this policy, supabase.from('clients').update() silently fails (RLS blocks it)
CREATE POLICY "clients: owner can update own record"
  ON public.clients FOR UPDATE
  USING (
    id IN (
      SELECT client_id FROM public.client_users
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    id IN (
      SELECT client_id FROM public.client_users
      WHERE user_id = auth.uid()
    )
  );
