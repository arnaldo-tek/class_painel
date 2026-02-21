import { useState } from 'react'
import { Link, useMatchRoute } from '@tanstack/react-router'
import {
  LayoutDashboard, BookOpen, Tags, Package, GraduationCap, Users,
  UserCog, DollarSign, Ticket, Newspaper, FileText, Headphones,
  FolderOpen, Megaphone, PlayCircle, LifeBuoy, MessageSquare,
  MessageCircle, SlidersHorizontal, ChevronDown, ChevronRight, LogOut, Menu, X,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { navigation } from '@/config/navigation'
import { filterNavigation } from '@/lib/rbac'
import type { NavItem } from '@/config/navigation'
import { useAuthContext } from '@/contexts/AuthContext'
import { usePermissions } from '@/hooks/usePermissions'
import { signOut } from '@/lib/auth'
import type { UserRole } from '@/types/enums'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, BookOpen, Tags, Package, GraduationCap, Users,
  UserCog, DollarSign, Ticket, Newspaper, FileText, Headphones,
  FolderOpen, Megaphone, PlayCircle, LifeBuoy, MessageSquare,
  MessageCircle, SlidersHorizontal,
}

function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = iconMap[name]
  if (!Icon) return null
  return <Icon className={className} />
}

function SidebarItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const matchRoute = useMatchRoute()
  const isActive = matchRoute({ to: item.path, fuzzy: true })

  if (item.children && item.children.length > 0) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
          )}
        >
          <NavIcon name={item.icon} className="h-5 w-5 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </>
          )}
        </button>
        {expanded && !collapsed && (
          <div className="ml-4 mt-1 space-y-1">
            {item.children.map((child) => (
              <SidebarItem key={child.path} item={child} collapsed={false} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      to={item.path}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-blue-50 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
      )}
    >
      <NavIcon name={item.icon} className="h-5 w-5 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  )
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, roles } = useAuthContext()
  const { data: permissions } = usePermissions(user?.id)

  const filteredNav = filterNavigation(
    navigation,
    roles as UserRole[],
    permissions ?? [],
  )

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-200',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
        {collapsed ? (
          <img src="/icon.png" alt="S" className="h-8 w-8" />
        ) : (
          <img src="/logo.png" alt="Superclasse" className="h-8" />
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
        >
          {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {filteredNav.map((item) => (
          <SidebarItem key={item.path} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3">
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  )
}
