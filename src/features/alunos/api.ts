import { supabase } from '@/lib/supabase'

export interface Aluno {
  id: string
  email: string
  display_name: string | null
  phone_number: string | null
  cpf: string | null
  is_suspended: boolean | null
  created_at: string | null
}

export interface AlunoEnrollment {
  id: string
  curso_id: string
  is_suspended: boolean | null
  enrolled_at: string | null
  cursos: { nome: string } | null
}

export async function fetchAlunos(search?: string, page = 1, perPage = 20) {
  let query = supabase
    .from('profiles')
    .select('id, email, display_name, phone_number, cpf, is_suspended, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })

  // Only show users who have 'aluno' role but NOT 'admin' or 'professor'
  const { data: alunoRoles } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'aluno')

  const { data: nonAlunoRoles } = await supabase
    .from('user_roles')
    .select('user_id')
    .in('role', ['admin', 'professor'])

  const excludeIds = new Set((nonAlunoRoles ?? []).map((r) => r.user_id))
  const alunoIds = (alunoRoles ?? []).map((r) => r.user_id).filter((id) => !excludeIds.has(id))
  if (alunoIds.length === 0) return { alunos: [] as Aluno[], total: 0, totalPages: 0 }

  query = query.in('id', alunoIds)

  if (search) {
    query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%,cpf.ilike.%${search}%`)
  }

  const from = (page - 1) * perPage
  query = query.range(from, from + perPage - 1)

  const { data, error, count } = await query
  if (error) throw error
  return {
    alunos: (data ?? []) as Aluno[],
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / perPage),
  }
}

export async function fetchAlunoEnrollments(userId: string) {
  const { data, error } = await supabase
    .from('enrollments')
    .select('id, curso_id, is_suspended, enrolled_at, cursos(nome)')
    .eq('user_id', userId)
    .order('enrolled_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as AlunoEnrollment[]
}

export async function toggleAlunoSuspended(userId: string, isSuspended: boolean) {
  const { error } = await supabase
    .from('profiles')
    .update({ is_suspended: isSuspended })
    .eq('id', userId)

  if (error) throw error
}
