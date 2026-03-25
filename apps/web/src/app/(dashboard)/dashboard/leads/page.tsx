import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LeadsTable } from '@/components/dashboard/leads-table'
import type { Lead } from '@/lib/types/dashboard'

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all leads — no pagination per D-41
  // RLS automatically scopes to user's client
  const { data: allLeads } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  const leads = (allLeads ?? []) as Lead[]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Leads</h1>
      <LeadsTable leads={leads} />
    </div>
  )
}
