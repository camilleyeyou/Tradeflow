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
  // @ts-expect-error -- types.ts is a stub until supabase gen types runs post-deployment
  const { error } = await supabase.from('leads').update({ status }).eq('id', leadId)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/leads')
  revalidatePath('/dashboard')
}

export async function updateLeadNotes(leadId: string, notes: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // @ts-expect-error -- types.ts is a stub until supabase gen types runs post-deployment
  const { error } = await supabase.from('leads').update({ notes }).eq('id', leadId)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/leads')
}
