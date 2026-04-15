import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'
import Link from 'next/link'

const GOLD = '#D4AF37'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdmin(user.email)) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="sticky top-0 z-40 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.85)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5">
          <Link href="/admin/clients" className="text-base font-semibold tracking-tight text-white" style={{ fontFamily: "'Gambetta', Georgia, serif" }}>
            Trade<span style={{ color: GOLD }}>flow</span>
            <span className="ml-2 text-xs font-medium text-white/25 uppercase tracking-widest">Admin</span>
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/admin/clients" className="text-sm font-medium text-white/50 hover:text-white transition-colors">
              Clients
            </Link>
            <Link href="/dashboard" className="text-sm text-white/30 hover:text-white/60 transition-colors">
              Dashboard
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
