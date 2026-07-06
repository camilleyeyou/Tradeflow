import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { decryptToken } from '@/lib/crypto'
import { getConversationMessages, sendSMSReply } from '@/lib/ghl'

export const dynamic = 'force-dynamic'

interface LeadRow {
  id: string
  client_id: string
  ghl_contact_id: string | null
}

interface LeadContext {
  lead: LeadRow
  locationId: string | null
  token: string | null
}

type ResolveResult =
  | { ok: true; context: LeadContext }
  | { ok: false; status: number; error: string }

/**
 * Resolves auth + RLS-scoped ownership for a lead, then (if the lead has a
 * synced GHL contact) reads the owning client's per-client GHL credentials
 * using a service-role client. The service-role read only happens AFTER
 * ownership has been verified via the RLS-scoped ssr client, so a caller can
 * never read another client's token by guessing a lead id.
 */
async function resolveLeadContext(id: string): Promise<ResolveResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, status: 401, error: 'Unauthorized' }
  }

  // RLS-scoped: returns null if this lead does not belong to the caller's client.
  const { data: lead } = await supabase
    .from('leads')
    .select('id, client_id, ghl_contact_id')
    .eq('id', id)
    .maybeSingle()

  if (!lead) {
    return { ok: false, status: 404, error: 'Not found' }
  }

  if (!lead.ghl_contact_id) {
    return { ok: true, context: { lead, locationId: null, token: null } }
  }

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: clientRow } = await serviceClient
    .from('clients')
    .select('ghl_sub_account_id, ghl_private_token_encrypted')
    .eq('id', lead.client_id)
    .single()

  const locationId = clientRow?.ghl_sub_account_id ?? null

  let token: string | null = null
  try {
    token = clientRow?.ghl_private_token_encrypted
      ? decryptToken(clientRow.ghl_private_token_encrypted)
      : (process.env.GHL_PRIVATE_TOKEN ?? null)
  } catch (err) {
    console.error('[leads/messages] token decrypt error:', err)
    token = null
  }

  return { ok: true, context: { lead, locationId, token } }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await resolveLeadContext(id)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  const { lead, locationId, token } = result.context
  if (!lead.ghl_contact_id || !locationId || !token) {
    // Contact not yet synced to GHL, or no credentials available — empty thread.
    return NextResponse.json({ messages: [] })
  }

  const messages = await getConversationMessages(lead.ghl_contact_id, locationId, token)
  return NextResponse.json({ messages })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  let message: unknown
  try {
    const body = await request.json()
    message = (body as { message?: unknown })?.message
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (typeof message !== 'string' || message.trim().length === 0) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  const result = await resolveLeadContext(id)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  const { lead, locationId, token } = result.context
  if (!lead.ghl_contact_id || !locationId || !token) {
    return NextResponse.json({ error: 'Contact not synced' }, { status: 409 })
  }

  const ok = await sendSMSReply(lead.ghl_contact_id, message, token)
  if (!ok) {
    return NextResponse.json({ success: false }, { status: 502 })
  }

  return NextResponse.json({ success: true })
}
