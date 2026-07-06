'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { LEAD_STATUSES } from '@/lib/types/dashboard'
import type { LeadStatus } from '@/lib/types/dashboard'

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
}

export async function updateLeadNotes(leadId: string, notes: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('leads').update({ notes }).eq('id', leadId)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/leads')
}
