import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsForm } from '@/components/dashboard/settings-form'
import type { Client } from '@/lib/types/dashboard'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get client data via client_users join
  // Cast to any — types.ts is a stub until supabase gen types runs post-deployment
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data: clientUser } = await db
    .from('client_users')
    .select('client_id, clients(*)')
    .eq('user_id', user.id)
    .single()

  const clientData = clientUser?.clients
  if (!clientData) redirect('/login')

  const client = clientData as Client

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <SettingsForm client={client} />
    </div>
  )
}
