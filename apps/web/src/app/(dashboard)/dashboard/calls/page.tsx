import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CallsTable } from '@/components/dashboard/calls-table'
import type { Call } from '@/lib/types/dashboard'

export const dynamic = 'force-dynamic'

export default async function CallsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all calls ordered by called_at DESC (per D-43)
  // RLS automatically scopes to user's client
  const { data: allCalls } = await supabase
    .from('calls')
    .select('*')
    .order('called_at', { ascending: false })

  const calls = (allCalls ?? []) as Call[]

  // CLIENT-TZ: render every timestamp in the client's own timezone
  const { data: cu } = await supabase
    .from('client_users')
    .select('clients(timezone)')
    .eq('user_id', user.id)
    .single()
  const timeZone = (cu?.clients as { timezone: string } | null)?.timezone ?? 'America/Chicago'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Call Log</h1>
      <CallsTable calls={calls} timeZone={timeZone} />
    </div>
  )
}
