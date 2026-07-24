'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'
import { createSubAccount } from '@/lib/ghl'
import { onboardingSchema } from '@/lib/validations/onboarding'
import { encryptToken } from '@/lib/crypto'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function onboardClient(formData: {
  business_name: string
  owner_name: string
  email: string
  phone: string
  city: string
  state: string
  service_area_zips: string
  plan: string
  trade: string
  ghl_private_token?: string
  timezone: string
}) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user || !isAdmin(user.email ?? undefined)) {
    throw new Error('Not authorized')
  }

  const parsed = onboardingSchema.safeParse(formData)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  const supabase = createAdminClient()

  // Step 1: Insert client record (D-54 step 1)
  // slug has no DB default (migration 002 backfilled existing rows only) — derive it
  // here using the same normalization the backfill used, so new inserts satisfy NOT NULL.
  let slug = parsed.data.business_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  // FIX-02: collision-safe slug — append -2, -3, ... on duplicate so inserts never
  // violate the slug UNIQUE constraint (migration 002).
  const { data: taken } = await supabase
    .from('clients')
    .select('slug')
    .ilike('slug', `${slug}%`)
  const existing = new Set((taken ?? []).map((r) => r.slug))
  if (existing.has(slug)) {
    let n = 2
    while (existing.has(`${slug}-${n}`)) n++
    slug = `${slug}-${n}`
  }

  const { data: client, error } = await supabase
    .from('clients')
    .insert({
      business_name: parsed.data.business_name,
      owner_name: parsed.data.owner_name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      city: parsed.data.city,
      state: parsed.data.state,
      service_area_zips: parsed.data.service_area_zips
        .split(',')
        .map((z: string) => z.trim())
        .filter(Boolean),
      plan: parsed.data.plan,
      trade: parsed.data.trade,
      slug,
      timezone: parsed.data.timezone,
      ghl_private_token_encrypted: parsed.data.ghl_private_token
        ? encryptToken(parsed.data.ghl_private_token)
        : null,
    })
    .select()
    .single()

  if (error || !client) {
    throw new Error(error?.message ?? 'Failed to create client record')
  }

  // Step 2: GHL sub-account provisioning (D-54 step 2, D-55 idempotency guard)
  // Note: client_users row creation is intentionally deferred.
  // The client_users table has user_id uuid NOT NULL references auth.users(id), so a partial row
  // without a user_id is impossible. After onboarding, the admin must manually create an auth user
  // in Supabase for the client's owner_email, then insert a client_users row linking that user_id
  // to this client's id. The redirect destination (detail page) should surface this reminder.
  const typedClient = client as { id: string; ghl_sub_account_id: string | null }

  if (!typedClient.ghl_sub_account_id) {
    const locationId = await createSubAccount({
      name: parsed.data.business_name,
      phone: parsed.data.phone,
      email: parsed.data.email,
      city: parsed.data.city,
      state: parsed.data.state,
      timezone: parsed.data.timezone,
    })

    if (locationId) {
      // Step 3: Store ghl_sub_account_id on client record (D-54 step 3)
      await supabase
        .from('clients')
        .update({ ghl_sub_account_id: locationId })
        .eq('id', typedClient.id)
    }
    // If GHL fails: client record still created, ghl_sub_account_id remains null (D-54)
  }

  // HARD-08: prime the new client's landing page in the cache.
  revalidatePath(`/${slug}`)

  redirect(`/admin/clients/${typedClient.id}`)
}
