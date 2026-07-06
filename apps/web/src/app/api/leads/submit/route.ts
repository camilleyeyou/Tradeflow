import { NextResponse } from 'next/server'
import { after } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { leadSchema } from '@/lib/validations/lead'
import { createGHLContact, addContactToWorkflow, lookupContactByPhone } from '@/lib/ghl'
import { decryptToken } from '@/lib/crypto'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { escapeHtml } from '@/lib/escape-html'
import { scoreLeadUrgency } from '@/lib/scoring'
import { Resend } from 'resend'

export async function POST(request: Request) {
  // Step 1 — Parse and validate (per D-13)
  const body = await request.json()

  // Step 1a — Honeypot (SPAM-01): silently succeed without processing.
  // The honeypot field is read from the raw body, not the Zod-parsed
  // result, since the schema strips unknown keys.
  if (typeof body?.company_website === 'string' && body.company_website.trim() !== '') {
    return NextResponse.json({ success: true })
  }

  // Step 1b — Per-IP rate limit (SPAM-01), before any DB/Zod work.
  const ip = getClientIp(request)
  if (!rateLimit(`lead:${ip}`, 5, 60_000).allowed) {
    return NextResponse.json(
      { error: 'Too many requests', code: 'RATE_LIMITED' },
      { status: 429 }
    )
  }

  const result = leadSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }
  const { client_id, homeowner_name, phone, service_type, zip_code } = result.data

  // Step 2 — Initialize Supabase with service role key (bypasses RLS)
  // NOTE: Using inline createClient per plan instructions — admin.ts is restricted to (admin)/ route group
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // Step 3 — Idempotency check (per D-14)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
  const { data: existing } = await supabase
    .from('leads')
    .select('id')
    .eq('client_id', client_id)
    .eq('phone', phone)
    .gte('created_at', fiveMinutesAgo)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ success: true, lead_id: existing.id })
  }

  // Step 4 — Insert lead
  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      client_id,
      homeowner_name,
      phone,
      zip_code,
      service_type,
      source: 'landing_page',
      status: 'new',
    })
    .select('id')
    .single()

  if (error || !lead) {
    console.error('[lead-submit] Supabase insert error:', error)
    return NextResponse.json(
      { error: 'Failed to create lead', code: 'DB_ERROR' },
      { status: 500 }
    )
  }

  // Step 5 — Return 200 immediately, then run GHL + Resend in after() (per D-13, D-29, D-30)
  after(async () => {
    // --- GHL Integration (per D-21, D-22, D-23, D-24, D-25) ---
    try {
      const { data: clientRow } = await supabase
        .from('clients')
        .select('ghl_sub_account_id, email, business_name, city, ghl_private_token_encrypted')
        .eq('id', client_id)
        .single()

      if (clientRow?.ghl_sub_account_id) {
        // FIX-01: prefer this client's own encrypted token; fall back to the
        // shared global token only if the client has none stored yet.
        const token = clientRow?.ghl_private_token_encrypted
          ? decryptToken(clientRow.ghl_private_token_encrypted)
          : process.env.GHL_PRIVATE_TOKEN

        if (token) {
          // Idempotency: check GHL for existing contact by phone (per D-14)
          let contactId = await lookupContactByPhone(phone, clientRow.ghl_sub_account_id, token)

          if (!contactId) {
            const nameParts = homeowner_name.split(' ')
            contactId = await createGHLContact({
              locationId: clientRow.ghl_sub_account_id,
              firstName: nameParts[0] || homeowner_name,
              lastName: nameParts.slice(1).join(' ') || '',
              phone,
              token,
            })
          }

          if (contactId) {
            // Store ghl_contact_id on lead record (per D-25, GHL-03)
            await supabase
              .from('leads')
              .update({ ghl_contact_id: contactId })
              .eq('id', lead.id)

            // Trigger SMS workflow (per D-23, LEAD-05)
            const workflowId = process.env.GHL_SMS_WORKFLOW_ID
            if (workflowId) {
              await addContactToWorkflow(contactId, workflowId, token)

              // Write initial sms_sequences record (per D-24)
              await supabase.from('sms_sequences').insert({
                lead_id: lead.id,
                touch_number: 1,
                message_body: 'Initial SMS workflow triggered',
                status: 'pending',
                scheduled_at: new Date().toISOString(),
              })
            }
          }
        }
      }
    } catch (err) {
      console.error('[lead-submit] GHL error:', err)
    }

    // --- Email Notification (per D-29, D-30 — best effort) ---
    try {
      const { data: clientRow } = await supabase
        .from('clients')
        .select('email, business_name, city, notifications_enabled')
        .eq('id', client_id)
        .single()

      if (clientRow?.email && clientRow.notifications_enabled !== false) {
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? 'leads@tradeflow.io',
          to: clientRow.email,
          subject: `New Lead: ${homeowner_name} — ${service_type.replace('-', ' ')}`,
          html: `<h2>New lead for ${escapeHtml(clientRow.business_name)}</h2>
            <table style="border-collapse:collapse;">
              <tr><td style="padding:4px 12px;font-weight:bold;">Name</td><td style="padding:4px 12px;">${escapeHtml(homeowner_name)}</td></tr>
              <tr><td style="padding:4px 12px;font-weight:bold;">Phone</td><td style="padding:4px 12px;">${escapeHtml(phone)}</td></tr>
              <tr><td style="padding:4px 12px;font-weight:bold;">Service</td><td style="padding:4px 12px;">${escapeHtml(service_type.replace('-', ' '))}</td></tr>
              <tr><td style="padding:4px 12px;font-weight:bold;">Zip Code</td><td style="padding:4px 12px;">${escapeHtml(zip_code)}</td></tr>
            </table>
            <p style="margin-top:16px;"><a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard">View in dashboard</a></p>`,
        })
      }
    } catch (err) {
      console.error('[lead-submit] Resend error:', err)
      // Best effort — do not throw (per D-30)
    }

    // --- AI Urgency Scoring (AI-01 — best effort, non-blocking) ---
    try {
      const urgency = await scoreLeadUrgency({
        service_type,
        source: 'landing_page',
        created_at: new Date().toISOString(),
      })
      if (urgency) {
        await supabase
          .from('leads')
          .update({ urgency_score: urgency.score, urgency_reason: urgency.reason })
          .eq('id', lead.id)
      }
    } catch (err) {
      console.error('[lead-submit] scoring error:', err)
    }
  })

  return NextResponse.json({ success: true, lead_id: lead.id })
}
