import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { SmsInbox } from '@/components/dashboard/sms-inbox'
import { truncatePhone, formatChicagoTime } from '@/lib/utils/format'
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
          <p>{formatChicagoTime(typedLead.created_at)}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Messages</h2>
        <SmsInbox leadId={typedLead.id} />
      </div>
    </div>
  )
}
