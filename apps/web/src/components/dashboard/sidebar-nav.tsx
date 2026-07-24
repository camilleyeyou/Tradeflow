'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Phone, Settings, Shield, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/actions/auth-actions'

const GOLD = '#D4AF37'

interface SidebarNavProps {
  businessName: string
  showAdmin?: boolean
}

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/leads', label: 'Leads', icon: Users },
  { href: '/dashboard/calls', label: 'Calls', icon: Phone },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function SidebarNav({ businessName, showAdmin }: SidebarNavProps) {
  const pathname = usePathname()

  const items = showAdmin
    ? [...navItems, { href: '/admin/clients', label: 'Admin', icon: Shield }]
    : navItems

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 flex-col h-screen sticky top-0" style={{ background: '#050505', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5">
            <img src="/logo-icon.svg" alt="" width={26} height={26} className="shrink-0" />
            <span className="text-base font-semibold tracking-tight text-white" style={{ fontFamily: "'Gambetta', Georgia, serif" }}>
              Trade<span style={{ color: GOLD }}>flow</span>
            </span>
          </div>
          <p className="text-xs text-white/60 mt-1.5 truncate">{businessName}</p>
        </div>

        <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
          {items.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/[0.03]'
                )}
                style={isActive ? {
                  background: 'rgba(212,175,55,0.08)',
                  color: GOLD,
                } : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/[0.03] transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign out
            </button>
          </form>
          <p className="text-xs text-white/40 px-3 pt-3">Tradeflow &middot; Lead Platform</p>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 inset-x-0 md:hidden z-50" style={{ background: '#050505', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex">
          {items.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                  isActive ? '' : 'text-white/60'
                )}
                style={isActive ? { color: GOLD } : undefined}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            )
          })}
          <form action={signOut} className="flex flex-1">
            <button
              type="submit"
              className="flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium text-white/60 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Sign out
            </button>
          </form>
        </div>
      </nav>
    </>
  )
}
