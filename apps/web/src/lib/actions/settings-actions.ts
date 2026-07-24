'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { settingsSchema } from '@/lib/validations/settings'

export async function updateClientSettings(formData: {
  business_name: string
  phone: string
  email: string
  city: string
  notifications_enabled: boolean
  google_review_url: string
  review_requests_enabled: boolean
}) {
  const parsed = settingsSchema.safeParse(formData)
  if (!parsed.success) throw new Error(parsed.error.issues[0].message)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get client_id from auth user via client_users join
  const { data: clientUser } = await supabase
    .from('client_users')
    .select('client_id')
    .eq('user_id', user.id)
    .single()

  if (!clientUser) throw new Error('No client found for user')

  // RLS UPDATE policy (migration 003) ensures only own record is updated
  const clientId = (clientUser as { client_id: string }).client_id
  const { error } = await supabase.from('clients').update(parsed.data).eq('id', clientId)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/settings')

  // HARD-08: keep the public landing page in sync with client edits (e.g. phone number).
  const { data: row } = await supabase.from('clients').select('slug').eq('id', clientId).single()
  if (row?.slug) revalidatePath(`/${(row as { slug: string }).slug}`)
}
