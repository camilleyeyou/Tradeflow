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
  // @ts-expect-error -- types.ts is a stub until supabase gen types runs post-deployment
  const { error } = await supabase.from('clients').update(parsed.data).eq('id', clientId)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/settings')
}
