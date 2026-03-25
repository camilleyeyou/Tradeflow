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
