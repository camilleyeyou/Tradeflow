import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { SmsInbox } from '@/components/dashboard/sms-inbox'
import { JobValueEditor } from '@/components/dashboard/job-value-editor'
import { truncatePhone, formatClientTime } from '@/lib/utils/format'
import type { Lead } from '@/lib/types/dashboard'

export const dynamic = 'force-dynamic'

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // RLS automatically scopes this to the caller's own client
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!lead) notFound()
  const typedLead = lead as Lead

  // CLIENT-TZ: render every timestamp in the client's own timezone
  const { data: cu } = await supabase
    .from('client_users')
    .select('clients(timezone)')
    .eq('user_id', user.id)
    .single()
  const timeZone = (cu?.clients as { timezone: string } | null)?.timezone ?? 'America/Chicago'

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/leads"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Back to leads
        </Link>
        <h1 className="mt-2 text-2xl font-bold">
          {typedLead.homeowner_name ?? 'Unknown'}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-2 rounded-lg border border-border bg-card p-4 text-sm sm:grid-cols-3">
        <div>
          <p className="text-muted-foreground">Phone</p>
          <p>{typedLead.phone ? truncatePhone(typedLead.phone) : '-'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Service Type</p>
          <p>{typedLead.service_type ?? '-'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Status</p>
          <p>{capitalize(typedLead.status)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Created</p>
          <p>{formatClientTime(typedLead.created_at, timeZone)}</p>
        </div>
        <div>
          <JobValueEditor
            leadId={typedLead.id}
            initialCents={typedLead.job_value_cents}
            status={typedLead.status}
          />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Messages</h2>
        <SmsInbox leadId={typedLead.id} timeZone={timeZone} />
      </div>
    </div>
  )
}
