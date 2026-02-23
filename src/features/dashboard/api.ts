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

  // Count cursos, average_rating
  const { data: cursos } = await supabase
    .from('cursos')
    .select('id, average_rating')
    .eq('professor_id', profId)

  const totalCursos = cursos?.length ?? 0
  const ratings = (cursos ?? []).filter((c) => c.average_rating != null).map((c) => Number(c.average_rating))
  const avaliacaoMedia = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null

  // Receita total (movimentacoes paid for this professor)
  const { data: mov } = await supabase
    .from('movimentacoes')
    .select('valor, taxa_plataforma')
    .eq('professor_id', profId)
    .eq('status', 'paid')

  const receitaTotal = (mov ?? []).reduce((s, m) => s + Number(m.valor ?? 0) - Number(m.taxa_plataforma ?? 0), 0)

  // Count distinct students (unique aluno emails from paid movimentacoes)
  const { data: alunos } = await supabase
    .from('movimentacoes')
    .select('email_cliente')
    .eq('professor_id', profId)
    .eq('status', 'paid')

  const uniqueAlunos = new Set((alunos ?? []).map((a) => a.email_cliente).filter(Boolean))
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
  const [cursosRes, profsRes, alunosRes, movRes] = await Promise.all([
    supabase.from('cursos').select('id', { count: 'exact', head: true }),
    supabase.from('professor_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('movimentacoes').select('valor').eq('status', 'paid'),
  ])

  const receitaTotal = (movRes.data ?? []).reduce((s, m) => s + Number(m.valor ?? 0), 0)

  return {
    totalCursos: cursosRes.count ?? 0,
    totalProfessores: profsRes.count ?? 0,
    totalAlunos: alunosRes.count ?? 0,
    receitaTotal,
  }
}
