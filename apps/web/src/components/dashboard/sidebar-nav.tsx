'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Phone, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarNavProps {
  businessName: string
}

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/leads', label: 'Leads', icon: Users },
  { href: '/dashboard/calls', label: 'Calls', icon: Phone },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function SidebarNav({ businessName }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 flex-col border-r border-white/8 bg-[#03101c] h-screen sticky top-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/8">
          <span className="text-base font-bold tracking-tight text-white">
            Trade<span className="text-[#0ccaff]">flow</span>
          </span>
          <p className="text-xs text-white/40 mt-0.5 truncate">{businessName}</p>
        </div>

        <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-[#0ccaff]/10 text-[#0ccaff]'
                    : 'text-white/50 hover:bg-white/5 hover:text-white'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-5 py-4 border-t border-white/8">
          <p className="text-xs text-white/25">Tradeflow · Lead Platform</p>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 inset-x-0 md:hidden border-t border-white/8 bg-[#03101c] z-50">
        <div className="flex">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                  isActive ? 'text-[#0ccaff]' : 'text-white/40'
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
