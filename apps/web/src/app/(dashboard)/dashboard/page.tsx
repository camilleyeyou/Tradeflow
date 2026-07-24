import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CountCards } from '@/components/dashboard/count-cards'
import { RecentLeads } from '@/components/dashboard/recent-leads'
import { RoiSummary, ESTIMATED_LEAD_VALUE } from '@/components/dashboard/roi-summary'
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
    .select('id, homeowner_name, service_type, status, created_at, first_contact_at, job_value_cents')
    .order('created_at', { ascending: false })

  const leads = (allLeads ?? []) as Lead[]

  const counts: StatusCounts = {
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    booked: leads.filter(l => l.status === 'booked').length,
    completed: leads.filter(l => l.status === 'completed').length,
  }

  const recentLeads = leads.slice(0, 5)

  // ROI-02: monthly lead count, reported + estimated value split, avg speed-to-lead
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const monthLeads = leads.filter(l => l.created_at >= startOfMonth)
  const monthLeadCount = monthLeads.length

  // JOB-VALUE: split real reported job value from the $ESTIMATED_LEAD_VALUE
  // placeholder — only completed leads without a reported value get estimated.
  const monthCompletedLeads = monthLeads.filter(l => l.status === 'completed')
  const reportedCents = monthCompletedLeads.reduce(
    (sum, l) => sum + (l.job_value_cents ?? 0),
    0
  )
  const completedWithoutValue = monthCompletedLeads.filter(l => l.job_value_cents == null).length
  const reportedValueDollars = Math.round(reportedCents / 100)
  const estimatedValueDollars = completedWithoutValue * ESTIMATED_LEAD_VALUE

  const speedsToLead = monthLeads
    .filter(l => l.first_contact_at)
    .map(l => (Date.parse(l.first_contact_at as string) - Date.parse(l.created_at)) / 60000)

  const avgSpeedToLeadMinutes =
    speedsToLead.length > 0
      ? Math.round(speedsToLead.reduce((sum, m) => sum + m, 0) / speedsToLead.length)
      : null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Overview</h1>
      <RoiSummary
        monthLeadCount={monthLeadCount}
        reportedValueDollars={reportedValueDollars}
        estimatedValueDollars={estimatedValueDollars}
        avgSpeedToLeadMinutes={avgSpeedToLeadMinutes}
      />
      <CountCards counts={counts} />
      <RecentLeads leads={recentLeads} />
    </div>
  )
}
