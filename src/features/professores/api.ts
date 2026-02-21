import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'
import type { ApprovalStatus } from '@/types/enums'

export type ProfessorProfile = Tables<'professor_profiles'> & {
  profiles: { email: string; display_name: string | null; phone_number: string | null } | null
}

export async function fetchProfessores(status?: ApprovalStatus) {
  let query = supabase
    .from('professor_profiles')
    .select('*, profiles!professor_profiles_user_id_fkey(email, display_name, phone_number)')
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('approval_status', status)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as ProfessorProfile[]
}

export async function fetchProfessor(id: string) {
  const { data, error } = await supabase
    .from('professor_profiles')
    .select('*, profiles!professor_profiles_user_id_fkey(email, display_name, phone_number)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as ProfessorProfile
}

export async function updateProfessorStatus(id: string, status: ApprovalStatus) {
  const { data: { user } } = await supabase.auth.getUser()

  const updates: Record<string, unknown> = { approval_status: status }
  if (status === 'aprovado') {
    updates.approved_at = new Date().toISOString()
    updates.approved_by = user?.id ?? null
  }

  const { error } = await supabase
    .from('professor_profiles')
    .update(updates)
    .eq('id', id)

  if (error) throw error
}

export async function updateProfessor(id: string, updates: Partial<Tables<'professor_profiles'>>) {
  const { data, error } = await supabase
    .from('professor_profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function fetchProfessorCursos(professorId: string) {
  const { data, error } = await supabase
    .from('cursos')
    .select('id, nome, preco, is_publicado, average_rating')
    .eq('professor_id', professorId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}
