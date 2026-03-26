'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createSubAccount } from '@/lib/ghl'
import { onboardingSchema } from '@/lib/validations/onboarding'
import { redirect } from 'next/navigation'

export async function onboardClient(formData: {
  business_name: string
  owner_name: string
  email: string
  phone: string
  city: string
  state: string
  service_area_zips: string
  plan: string
}) {
  const parsed = onboardingSchema.safeParse(formData)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  const supabase = createAdminClient()

  // Step 1: Insert client record (D-54 step 1)
  // Cast insert payload to any — types.ts stub maps Insert to Record<string,unknown> which
  // the Postgres builder treats as never for write operations; auto-resolves post-deployment
  const { data: client, error } = await (supabase as any)
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
    })

    if (locationId) {
      // Step 3: Store ghl_sub_account_id on client record (D-54 step 3)
      await (supabase as any)
        .from('clients')
        .update({ ghl_sub_account_id: locationId })
        .eq('id', typedClient.id)
    }
    // If GHL fails: client record still created, ghl_sub_account_id remains null (D-54)
  }

  redirect(`/admin/clients/${typedClient.id}`)
}
