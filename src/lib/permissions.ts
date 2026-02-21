import { supabase } from './supabase'
import type { UserRole, AdminPermission } from '@/types/enums'

export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)

  if (error) throw error
  return data.map((r) => r.role)
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('admin_permissions')
    .select('permission')
    .eq('user_id', userId)

  if (error) throw error
  return data.map((p) => p.permission)
}

export function isAdmin(roles: UserRole[]): boolean {
  return roles.includes('admin')
}

export function isProfessor(roles: UserRole[]): boolean {
  return roles.includes('professor')
}

export function hasPermission(permissions: string[], required: AdminPermission): boolean {
  return permissions.includes(required)
}

export async function getProfessorProfile(userId: string) {
  const { data, error } = await supabase
    .from('professor_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}
