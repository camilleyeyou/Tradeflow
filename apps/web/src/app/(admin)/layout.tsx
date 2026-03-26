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
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/admin/clients" className="text-lg font-semibold">
            Tradeflow Admin
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/admin/clients" className="text-sm text-gray-600 hover:text-gray-900">
              Clients
            </Link>
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
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
