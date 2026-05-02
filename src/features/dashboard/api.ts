import { supabase } from '@/lib/supabase'

export interface ProfessorStats {
  totalCursos: number
  totalAlunos: number
  receitaTotal: number
  avaliacaoMedia: number | null
}

export async function fetchProfessorStats(professorId: string): Promise<ProfessorStats> {
  // Fetch professor_profile id from user_id
  const { data: prof } = await supabase
    .from('professor_profiles')
    .select('id')
    .eq('user_id', professorId)
    .single()

  if (!prof) return { totalCursos: 0, totalAlunos: 0, receitaTotal: 0, avaliacaoMedia: null }

  const profId = prof.id

  // Count cursos
  const { data: cursos } = await supabase
    .from('cursos')
    .select('id')
    .eq('professor_id', profId)

  const totalCursos = cursos?.length ?? 0
  const cursoIds = (cursos ?? []).map((c) => c.id)

  // Average rating from avaliacoes table
  const { data: avs } = cursoIds.length > 0
    ? await supabase.from('avaliacoes').select('rating').eq('professor_id', profId)
    : { data: [] }
  const avaliacaoMedia = avs && avs.length > 0
    ? avs.reduce((s, a) => s + Number(a.rating), 0) / avs.length
    : null

  // Receita total (movimentacoes paid for this professor)
  const { data: mov } = await supabase
    .from('movimentacoes')
    .select('valor, taxa_plataforma')
    .eq('professor_id', profId)
    .eq('status', 'paid')

  const receitaTotal = (mov ?? []).reduce((s, m) => s + Number(m.valor ?? 0) - Number(m.taxa_plataforma ?? 0), 0)

  // Count distinct enrolled students across professor's courses
  const { data: enrollments } = cursoIds.length > 0
    ? await supabase.from('enrollments').select('user_id').in('curso_id', cursoIds)
    : { data: [] }

  const uniqueAlunos = new Set((enrollments ?? []).map((e) => e.user_id))
  const totalAlunos = uniqueAlunos.size

  return { totalCursos, totalAlunos, receitaTotal, avaliacaoMedia }
}

export interface AdminStats {
  totalCursos: number
  totalProfessores: number
  totalAlunos: number
  receitaTotal: number
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const [cursosRes, profsRes, movRes, alunoRolesRes, adminRolesRes] = await Promise.all([
    supabase.from('cursos').select('id', { count: 'exact', head: true }),
    supabase.from('professor_profiles').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('movimentacoes').select('valor').eq('status', 'paid'),
    supabase.from('user_roles').select('user_id').eq('role', 'aluno'),
    supabase.from('user_roles').select('user_id').eq('role', 'admin'),
  ])

  const adminIds = new Set((adminRolesRes.data ?? []).map((r) => r.user_id))
  const totalAlunos = (alunoRolesRes.data ?? []).filter((r) => !adminIds.has(r.user_id)).length

  const receitaTotal = (movRes.data ?? []).reduce((s, m) => s + Number(m.valor ?? 0), 0)

  return {
    totalCursos: cursosRes.count ?? 0,
    totalProfessores: profsRes.count ?? 0,
    totalAlunos,
    receitaTotal,
  }
}
