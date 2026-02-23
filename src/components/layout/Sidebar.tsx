import { useState } from 'react'
import { Link, useMatchRoute } from '@tanstack/react-router'
import {
  LayoutDashboard, BookOpen, Tags, Package, GraduationCap, Users,
  UserCog, DollarSign, Ticket, Newspaper, FileText, Headphones,
  FolderOpen, Megaphone, PlayCircle, LifeBuoy, MessageSquare,
  MessageCircle, SlidersHorizontal, HelpCircle, UserCircle,
  ShoppingBag, Layers, Network, Briefcase, Image,
  ChevronDown, ChevronRight, LogOut, Menu, X, Lock,
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
  MessageCircle, SlidersHorizontal, HelpCircle, UserCircle,
  ShoppingBag, Layers, Network, Briefcase, Image,
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

  if (item.comingSoon) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
          'text-slate-500 cursor-not-allowed',
        )}
      >
        <NavIcon name={item.icon} className="h-5 w-5 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1">{item.label}</span>
            <Lock className="h-3.5 w-3.5" />
          </>
        )}
      </div>
    )
  }

  if (item.children && item.children.length > 0) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            'text-slate-300 hover:bg-white/5 hover:text-white',
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
          ? 'bg-white/10 text-white border-l-2 border-blue-400'
          : 'text-slate-300 hover:bg-white/5 hover:text-white',
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
        'flex h-screen flex-col border-r border-white/10 bg-gradient-to-b from-slate-900 via-slate-800 to-blue-900 transition-all duration-200',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        {collapsed ? (
          <img src="/icon.png" alt="S" className="h-8 w-8" />
        ) : (
          <img src="/logo.png" alt="Superclasse" className="h-8" />
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
        >
          {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {filteredNav.map((item) => (
          <SidebarItem key={item.path + item.label} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-3">
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  )
}
