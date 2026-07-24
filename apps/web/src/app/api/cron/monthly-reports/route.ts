import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { escapeHtml } from '@/lib/escape-html'
import { ESTIMATED_LEAD_VALUE } from '@/components/dashboard/roi-summary'

export const dynamic = 'force-dynamic'

interface ClientRow {
  id: string
  business_name: string
  email: string
}

interface LeadStatsRow {
  status: string | null
  source: string | null
  created_at: string
  first_contact_at: string | null
  urgency_score: number | null
  job_value_cents: number | null
}

interface CallStatsRow {
  outcome: string | null
}

export async function GET(request: Request) {
  // Step 1 — Auth
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.warn('[cron/monthly-reports] CRON_SECRET unset — no-op')
    return NextResponse.json({ clients_processed: 0, emails_sent: 0, skipped: 'CRON_SECRET unset' })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Step 2 — Service-role Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // Step 3 — Prior calendar month (UTC)
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const monthName = monthStart.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })

  // Step 4 — Active, notifiable clients
  const { data: clients } = await supabase
    .from('clients')
    .select('id, business_name, email')
    .eq('is_active', true)
    .eq('notifications_enabled', true)

  // Step 5 — Resend guard
  const resendApiKey = process.env.RESEND_API_KEY
  const resend = resendApiKey ? new Resend(resendApiKey) : null
  if (!resend) {
    console.warn('[cron/monthly-reports] RESEND_API_KEY unset — computing stats but skipping sends')
  }

  let clientsProcessed = 0
  let emailsSent = 0

  for (const client of (clients ?? []) as ClientRow[]) {
    try {
      const { data: leadsData } = await supabase
        .from('leads')
        .select('status, source, created_at, first_contact_at, urgency_score, job_value_cents')
        .eq('client_id', client.id)
        .gte('created_at', monthStart.toISOString())
        .lt('created_at', monthEnd.toISOString())

      const { data: callsData } = await supabase
        .from('calls')
        .select('outcome')
        .eq('client_id', client.id)
        .gte('called_at', monthStart.toISOString())
        .lt('called_at', monthEnd.toISOString())

      const leads = (leadsData ?? []) as LeadStatsRow[]
      const calls = (callsData ?? []) as CallStatsRow[]

      if (leads.length === 0 && calls.length === 0) continue

      const totalLeads = leads.length
      const statusCounts: Record<string, number> = {}
      const sourceCounts: Record<string, number> = {}
      let speedSumMinutes = 0
      let speedCount = 0
      let hotLeads = 0

      for (const lead of leads) {
        const status = lead.status ?? 'unknown'
        statusCounts[status] = (statusCounts[status] ?? 0) + 1

        const source = lead.source ?? 'unknown'
        sourceCounts[source] = (sourceCounts[source] ?? 0) + 1

        if (lead.first_contact_at) {
          const diffMinutes = (new Date(lead.first_contact_at).getTime() - new Date(lead.created_at).getTime()) / 60000
          speedSumMinutes += diffMinutes
          speedCount += 1
        }

        if (lead.urgency_score !== null && lead.urgency_score >= 8) {
          hotLeads += 1
        }
      }

      const totalCalls = calls.length
      const missedCalls = calls.filter((c) => c.outcome === 'missed').length
      const avgSpeedMin = speedCount > 0 ? Math.round(speedSumMinutes / speedCount) : null

      // JOB-VALUE: split real reported job value from the $ESTIMATED_LEAD_VALUE
      // placeholder — only completed leads without a reported value get estimated.
      const completedLeads = leads.filter((l) => l.status === 'completed')
      const reportedCents = completedLeads.reduce((sum, l) => sum + (l.job_value_cents ?? 0), 0)
      const completedWithoutValue = completedLeads.filter((l) => l.job_value_cents == null).length
      const reportedValue = Math.round(reportedCents / 100)
      const estimatedValue = completedWithoutValue * ESTIMATED_LEAD_VALUE

      const statusRows = Object.entries(statusCounts)
        .map(([status, count]) => `<tr><td style="padding:4px 12px;">${escapeHtml(status)}</td><td style="padding:4px 12px;">${count}</td></tr>`)
        .join('')
      const sourceRows = Object.entries(sourceCounts)
        .map(([source, count]) => `<tr><td style="padding:4px 12px;">${escapeHtml(source)}</td><td style="padding:4px 12px;">${count}</td></tr>`)
        .join('')

      const html = `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#0b0b0c;padding:24px;text-align:center;">
            <span style="color:#d4af37;font-weight:700;font-size:20px;letter-spacing:1px;">TRADEFLOW</span>
          </div>
          <div style="padding:24px;">
            <h2 style="margin-top:0;">${escapeHtml(client.business_name)}'s ${escapeHtml(monthName)} report</h2>
            <table style="border-collapse:collapse;width:100%;">
              <tr><td style="padding:4px 12px;font-weight:bold;">Leads captured</td><td style="padding:4px 12px;">${totalLeads}</td></tr>
            </table>
            <h3 style="margin-bottom:4px;">Status breakdown</h3>
            <table style="border-collapse:collapse;width:100%;">${statusRows}</table>
            <h3 style="margin-bottom:4px;">Sources</h3>
            <table style="border-collapse:collapse;width:100%;">${sourceRows}</table>
            <table style="border-collapse:collapse;width:100%;margin-top:16px;">
              <tr><td style="padding:4px 12px;font-weight:bold;">Calls</td><td style="padding:4px 12px;">${totalCalls}</td></tr>
              <tr><td style="padding:4px 12px;font-weight:bold;">Missed calls</td><td style="padding:4px 12px;">${missedCalls}</td></tr>
              <tr><td style="padding:4px 12px;font-weight:bold;">Avg speed-to-lead</td><td style="padding:4px 12px;">${avgSpeedMin !== null ? `${avgSpeedMin} min` : '—'}</td></tr>
              <tr><td style="padding:4px 12px;font-weight:bold;">Hot leads</td><td style="padding:4px 12px;">${hotLeads}</td></tr>
              <tr><td style="padding:4px 12px;font-weight:bold;">Estimated pipeline value</td><td style="padding:4px 12px;">$${(reportedValue + estimatedValue).toLocaleString()} <span style="color:#888;font-size:12px;">${reportedValue > 0 ? `(${reportedValue.toLocaleString()} reported + ${estimatedValue.toLocaleString()} estimated)` : '(estimated — not actual revenue)'}</span></td></tr>
            </table>
            <p style="margin-top:24px;"><a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard" style="color:#0b0b0c;">View in dashboard</a></p>
          </div>
        </div>
      `

      if (resend && client.email) {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? 'leads@tradeflow.io',
          to: client.email,
          subject: `Your ${monthName} Tradeflow report — ${totalLeads} leads captured`,
          html,
        })
        emailsSent += 1
      }

      clientsProcessed += 1
    } catch (err) {
      console.error(`[cron/monthly-reports] failed for client_id=${client.id}:`, err)
    }
  }

  return NextResponse.json({ clients_processed: clientsProcessed, emails_sent: emailsSent })
}
