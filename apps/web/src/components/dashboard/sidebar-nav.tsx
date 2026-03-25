'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Phone, Settings } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
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
      {/* Desktop sidebar — hidden below md */}
      <aside className="hidden md:flex md:w-64 flex-col border-r bg-background h-screen sticky top-0">
        <div className="px-4 py-5">
          <span className="font-semibold text-sm truncate">{businessName}</span>
        </div>
        <Separator />
        <nav className="flex flex-col gap-1 px-2 py-4">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile bottom tab bar — hidden above md */}
      <nav className="fixed bottom-0 inset-x-0 md:hidden border-t bg-background z-50">
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
                  isActive ? 'text-primary' : 'text-muted-foreground'
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
