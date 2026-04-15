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

  const clientData = clientUser?.clients as Client | null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      {clientData ? (
        <SettingsForm client={clientData} />
      ) : (
        <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-white/50 text-[15px] mb-2">No business profile found</p>
          <p className="text-white/30 text-[13px]">Contact support to get your account set up.</p>
        </div>
      )}
    </div>
  )
}
