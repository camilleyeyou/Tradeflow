import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SidebarNav } from '@/components/dashboard/sidebar-nav'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch business name via client_users join
  const { data: clientUser } = await supabase
    .from('client_users')
    .select('client_id, clients(business_name)')
    .eq('user_id', user.id)
    .single()

  const businessName =
    (clientUser as { clients: { business_name: string } | null } | null)?.clients?.business_name ?? 'Dashboard'

  return (
    <div className="flex min-h-screen">
      <SidebarNav businessName={businessName} />
      <main className="flex-1 pb-16 md:pb-0 p-4 md:p-6">
        {children}
      </main>
    </div>
  )
}
