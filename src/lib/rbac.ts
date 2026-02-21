import type { UserRole, AdminPermission } from '@/types/enums'
import type { NavItem } from '@/config/navigation'

/**
 * Verifica se o usuário pode ver um item de navegação baseado em:
 * 1. Roles do usuário
 * 2. Permissões granulares (para colaboradores)
 *
 * Admin vê tudo. Professor vê items com role 'professor'.
 * Colaborador precisa da permissão específica.
 */
export function canAccessNavItem(
  item: NavItem,
  roles: UserRole[],
  permissions: string[],
): boolean {
  // Admin vê tudo
  if (roles.includes('admin')) return true

  // Se o item tem roles definidos, verifica se o usuário tem algum deles
  if (item.roles && item.roles.length > 0) {
    const hasRole = item.roles.some((r) => roles.includes(r))
    if (!hasRole) return false
  }

  // Se é colaborador e o item tem permissão específica, verifica
  if (roles.includes('colaborador') && item.permission) {
    return permissions.includes(item.permission)
  }

  return true
}

export function filterNavigation(
  items: NavItem[],
  roles: UserRole[],
  permissions: string[],
): NavItem[] {
  return items
    .filter((item) => canAccessNavItem(item, roles, permissions))
    .map((item) => ({
      ...item,
      children: item.children
        ? filterNavigation(item.children, roles, permissions)
        : undefined,
    }))
}
