-- 006_add_ghl_token_to_clients.sql
-- Per-client encrypted GHL Private Integration Token (FIX-01). Stored as AES-256-GCM ciphertext.
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS ghl_private_token_encrypted text;
