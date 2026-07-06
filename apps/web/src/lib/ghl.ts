const GHL_BASE_URL = 'https://services.leadconnectorhq.com'
const GHL_API_VERSION = '2021-07-28'

interface GHLContactInput {
  locationId: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  token: string
}

async function ghlFetch(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${GHL_BASE_URL}${path}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Version': GHL_API_VERSION,
      ...(options.headers ?? {}),
    },
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`GHL API error ${response.status}: ${body}`)
  }

  return response
}

export async function createGHLContact(input: GHLContactInput): Promise<string | null> {
  const { locationId, firstName, lastName, phone, email, token } = input
  try {
    const body: Record<string, string> = { firstName, lastName, phone, locationId }
    if (email) body.email = email

    const response = await ghlFetch('/contacts/', token, {
      method: 'POST',
      body: JSON.stringify(body),
    })

    const data = await response.json() as { contact?: { id?: string } }
    return data.contact?.id ?? null
  } catch (err) {
    console.error('[ghl] create contact error:', err)
    return null
  }
}

export async function lookupContactByPhone(
  phone: string,
  locationId: string,
  token: string
): Promise<string | null> {
  try {
    const params = new URLSearchParams({ locationId, phone })
    const response = await ghlFetch(`/contacts/?${params.toString()}`, token, {
      method: 'GET',
    })

    const data = await response.json() as { contacts?: Array<{ id?: string }> }
    const contacts = data.contacts ?? []
    return contacts.length > 0 ? (contacts[0].id ?? null) : null
  } catch (err) {
    console.error('[ghl] lookup contact error:', err)
    return null
  }
}

export async function addContactToWorkflow(
  contactId: string,
  workflowId: string,
  token: string
): Promise<boolean> {
  try {
    await ghlFetch(`/contacts/${contactId}/workflow/${workflowId}`, token, {
      method: 'POST',
      body: JSON.stringify({ eventStartTime: new Date().toISOString() }),
    })
    return true
  } catch (err) {
    console.error('[ghl] add to workflow error:', err)
    return false
  }
}

export interface GHLMessage {
  id: string
  direction: 'inbound' | 'outbound'
  body: string
  dateAdded: string
}

interface GHLConversationSearchResponse {
  conversations?: Array<{ id?: string }>
}

interface GHLMessagesResponse {
  messages?: Array<Record<string, unknown>> | { messages?: Array<Record<string, unknown>> }
}

/**
 * Fetches the SMS thread for a GHL contact.
 *
 * GHL v2 (LeadConnector) endpoints used — NOT yet verified against a live
 * conversations-scoped token in this codebase; confirm at deploy time:
 *   GET /conversations/search?locationId=&contactId=  -> { conversations: [{ id }] }
 *   GET /conversations/{conversationId}/messages       -> { messages: [...] | { messages: [...] } }
 *
 * Degrades to [] on any error (missing scope, network failure, no conversation)
 * so the dashboard never crashes if the conversations scope is unavailable.
 */
export async function getConversationMessages(
  contactId: string,
  locationId: string,
  token: string
): Promise<GHLMessage[]> {
  try {
    const search = await ghlFetch(
      `/conversations/search?${new URLSearchParams({ locationId, contactId }).toString()}`,
      token,
      { method: 'GET' }
    )
    const sdata = await search.json() as GHLConversationSearchResponse
    const conversationId = sdata.conversations?.[0]?.id
    if (!conversationId) return []

    const res = await ghlFetch(`/conversations/${conversationId}/messages`, token, { method: 'GET' })
    const data = await res.json() as GHLMessagesResponse
    // GHL nests messages under messages.messages in some responses — normalize both shapes.
    const raw = Array.isArray(data.messages)
      ? data.messages
      : (data.messages?.messages ?? [])

    return raw.map((m) => ({
      id: String(m.id ?? ''),
      direction: m.direction === 'inbound' ? 'inbound' : 'outbound',
      body: String(m.body ?? m.message ?? ''),
      dateAdded: String(m.dateAdded ?? m.dateUpdated ?? ''),
    }))
  } catch (err) {
    console.error('[ghl] getConversationMessages error:', err)
    return []
  }
}

/**
 * Sends an outbound SMS reply to a GHL contact.
 *
 * GHL v2 endpoint used — NOT yet verified against a live conversations-scoped
 * token in this codebase; confirm at deploy time:
 *   POST /conversations/messages  { type: 'SMS', contactId, message }
 *
 * Degrades to false on any error so the caller can surface a retry prompt
 * instead of crashing.
 */
export async function sendSMSReply(
  contactId: string,
  message: string,
  token: string
): Promise<boolean> {
  try {
    await ghlFetch('/conversations/messages', token, {
      method: 'POST',
      body: JSON.stringify({ type: 'SMS', contactId, message }),
    })
    return true
  } catch (err) {
    console.error('[ghl] sendSMSReply error:', err)
    return false
  }
}

interface CreateSubAccountInput {
  name: string
  phone: string
  email: string
  city: string
  state: string
}

export async function createSubAccount(
  input: CreateSubAccountInput
): Promise<string | null> {
  const agencyToken = process.env.GHL_AGENCY_API_KEY
  if (!agencyToken) {
    console.error('[ghl] GHL_AGENCY_API_KEY not set — cannot create sub-account')
    return null
  }

  try {
    const response = await ghlFetch('/locations/', agencyToken, {
      method: 'POST',
      body: JSON.stringify({
        name: input.name,
        phone: input.phone,
        email: input.email,
        city: input.city,
        state: input.state,
        country: 'US',
        timezone: 'America/Chicago',
      }),
    })

    const data = await response.json() as { id?: string; location?: { id?: string } }
    // GHL API v2 may return id at top level or nested — handle both (Pitfall 2 from RESEARCH.md)
    const locationId = data.id ?? data.location?.id ?? null
    if (locationId) {
      console.log('[ghl] Sub-account created: locationId=%s', locationId)
    } else {
      console.error('[ghl] Sub-account created but no ID in response:', JSON.stringify(data))
    }
    return locationId
  } catch (err) {
    console.error('[ghl] createSubAccount error:', err)
    return null
  }
}
