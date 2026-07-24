'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { LEAD_STATUSES } from '@/lib/types/dashboard'
import type { LeadStatus } from '@/lib/types/dashboard'
import { decryptToken } from '@/lib/crypto'
import { sendSMSReply } from '@/lib/ghl'

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  if (!LEAD_STATUSES.includes(status)) throw new Error('Invalid status')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // RLS enforces ownership — no manual client_id check needed
  const { data: current } = await supabase
    .from('leads')
    .select('first_contact_at')
    .eq('id', leadId)
    .maybeSingle()

  const update: { status: LeadStatus; first_contact_at?: string } = { status }
  if (status !== 'new' && !current?.first_contact_at) {
    // Earliest-touch wins — only stamp on the first move off 'new' (ROI-01)
    update.first_contact_at = new Date().toISOString()
  }

  const { error } = await supabase.from('leads').update(update).eq('id', leadId)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/leads')
  revalidatePath('/dashboard')

  if (status === 'completed') {
    // Best-effort, one-time review-request SMS — must never affect the status
    // update above (already committed) or throw back to the caller.
    after(async () => {
      try {
        await maybeSendReviewRequest(leadId)
      } catch (err) {
        console.error('[lead-actions] review request error:', err)
      }
    })
  }
}

/**
 * Sends a one-time Google review-request SMS to the homeowner when a lead is
 * marked completed. Idempotency contract: claim leads.review_requested_at
 * FIRST via a conditional update (`is('review_requested_at', null)`) — only
 * proceed if a row was actually affected. This is the single guard that
 * prevents this path and the FastAPI ContactTagAdded path from ever
 * double-sending.
 */
async function maybeSendReviewRequest(leadId: string): Promise<void> {
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: leadRow } = await serviceClient
    .from('leads')
    .select('phone, ghl_contact_id, review_requested_at, client_id')
    .eq('id', leadId)
    .single()

  if (!leadRow || !leadRow.ghl_contact_id || leadRow.review_requested_at) return

  const { data: clientRow } = await serviceClient
    .from('clients')
    .select('business_name, google_review_url, review_requests_enabled, ghl_private_token_encrypted')
    .eq('id', leadRow.client_id)
    .single()

  if (!clientRow || !clientRow.review_requests_enabled || !clientRow.google_review_url) return

  // Claim FIRST — only one of (this path, the FastAPI webhook path) can win.
  const { data: claimed } = await serviceClient
    .from('leads')
    .update({ review_requested_at: new Date().toISOString() })
    .eq('id', leadId)
    .is('review_requested_at', null)
    .select('id')

  if (!claimed || claimed.length === 0) return

  const token = clientRow.ghl_private_token_encrypted
    ? decryptToken(clientRow.ghl_private_token_encrypted)
    : (process.env.GHL_PRIVATE_TOKEN ?? null)
  if (!token) return

  const message = `Thanks for choosing ${clientRow.business_name || 'us'}! If we did a great job, would you mind leaving us a quick review? ${clientRow.google_review_url}`
  await sendSMSReply(leadRow.ghl_contact_id, message, token)
}

export async function updateLeadNotes(leadId: string, notes: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('leads').update({ notes }).eq('id', leadId)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/leads')
}

const MAX_JOB_VALUE_CENTS = 100_000_000 // $1,000,000 cap

export async function updateLeadJobValue(leadId: string, jobValueCents: number | null) {
  if (jobValueCents !== null) {
    if (!Number.isFinite(jobValueCents) || !Number.isInteger(jobValueCents)) {
      throw new Error('Job value must be a whole number of cents')
    }
    if (jobValueCents < 0) throw new Error('Job value cannot be negative')
    if (jobValueCents > MAX_JOB_VALUE_CENTS) throw new Error('Job value is too large')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // RLS enforces ownership — no manual client_id check needed
  const { error } = await supabase
    .from('leads')
    .update({ job_value_cents: jobValueCents })
    .eq('id', leadId)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/leads')
  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/leads/${leadId}`)
}
