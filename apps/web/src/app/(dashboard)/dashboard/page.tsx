import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CountCards } from '@/components/dashboard/count-cards'
import { RecentLeads } from '@/components/dashboard/recent-leads'
import type { Lead, StatusCounts } from '@/lib/types/dashboard'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all leads for count cards + recent leads (per D-36, D-37)
  // RLS scopes to user's client automatically
  const { data: allLeads } = await supabase
    .from('leads')
    .select('id, homeowner_name, service_type, status, created_at')
    .order('created_at', { ascending: false })

  const leads = (allLeads ?? []) as Lead[]

  const counts: StatusCounts = {
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    booked: leads.filter(l => l.status === 'booked').length,
    completed: leads.filter(l => l.status === 'completed').length,
  }

  const recentLeads = leads.slice(0, 5)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Overview</h1>
      <CountCards counts={counts} />
      <RecentLeads leads={recentLeads} />
    </div>
  )
}
