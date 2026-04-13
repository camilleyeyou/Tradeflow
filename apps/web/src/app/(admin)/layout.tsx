import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[#03101c]">
      <header className="border-b border-white/8 bg-[#03101c]/95 backdrop-blur-sm sticky top-0 z-40">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5">
          <Link href="/admin/clients" className="text-base font-bold tracking-tight text-white">
            Trade<span className="text-[#0ccaff]">flow</span>
            <span className="ml-2 text-xs font-medium text-white/30 uppercase tracking-widest">Admin</span>
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/admin/clients" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Clients
            </Link>
            <Link href="/" className="text-sm text-white/30 hover:text-white/60 transition-colors">
              Back to site
            </Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        {children}
      </main>
    </div>
  )
}
