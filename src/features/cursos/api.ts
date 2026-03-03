import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'

export type Curso = Tables<'cursos'> & {
  professor_profiles: { nome_professor: string } | null
  categorias: { nome: string } | null
}

export interface CursosFilters {
  search?: string
  professorId?: string
  categoriaId?: string
  status?: 'publicado' | 'rascunho' | 'encerrado' | ''
  page?: number
  perPage?: number
}

const PAGE_SIZE = 20

export async function fetchCursos(filters: CursosFilters) {
  const { search, professorId, categoriaId, status, page = 1, perPage = PAGE_SIZE } = filters

  let query = supabase
    .from('cursos')
    .select(
      '*, professor_profiles!cursos_professor_id_fkey(nome_professor), categorias(nome)',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })

  if (search) {
    query = query.ilike('nome', `%${search}%`)
  }

  if (professorId) {
    query = query.eq('professor_id', professorId)
  }

  if (categoriaId) {
    query = query.eq('categoria_id', categoriaId)
  }

  if (status === 'publicado') {
    query = query.eq('is_publicado', true).eq('is_encerrado', false)
  } else if (status === 'rascunho') {
    query = query.eq('is_publicado', false)
  } else if (status === 'encerrado') {
    query = query.eq('is_encerrado', true)
  }

  const from = (page - 1) * perPage
  const to = from + perPage - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw error
  return {
    cursos: (data ?? []) as Curso[],
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / perPage),
  }
}

export async function fetchCurso(id: string) {
  const { data, error } = await supabase
    .from('cursos')
    .select(
      '*, professor_profiles!cursos_professor_id_fkey(nome_professor), categorias(nome)',
    )
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Curso
}

export async function createCurso(curso: Tables<'cursos'> extends infer T ? Omit<T, 'id' | 'created_at' | 'updated_at' | 'average_rating'> : never) {
  const { data, error } = await supabase
    .from('cursos')
    .insert(curso)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCurso(id: string, updates: Partial<Tables<'cursos'>>) {
  const { data, error } = await supabase
    .from('cursos')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function encerrarCurso(id: string) {
  const { error } = await supabase
    .from('cursos')
    .update({ is_encerrado: true, is_publicado: false })
    .eq('id', id)
  if (error) throw error
}

export async function togglePublicarCurso(id: string, publicar: boolean) {
  const { error } = await supabase
    .from('cursos')
    .update({ is_publicado: publicar })
    .eq('id', id)
  if (error) throw error
}

export interface CursoEnrollment {
  id: string
  user_id: string
  enrolled_at: string | null
  is_suspended: boolean | null
  profiles: { display_name: string | null; email: string | null } | null
}

export async function fetchCursoEnrollments(cursoId: string) {
  const { data, error } = await supabase
    .from('enrollments')
    .select('id, user_id, enrolled_at, is_suspended, profiles(display_name, email)')
    .eq('curso_id', cursoId)
    .order('enrolled_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as CursoEnrollment[]
}

export async function fetchProfessores() {
  const { data, error } = await supabase
    .from('professor_profiles')
    .select('id, nome_professor, user_id')
    .eq('approval_status', 'aprovado')
    .order('nome_professor')

  if (error) throw error
  return data ?? []
}

export async function fetchCategoriasCurso() {
  const { data, error } = await supabase
    .from('categorias')
    .select('id, nome')
    .eq('tipo', 'curso')
    .order('nome')

  if (error) throw error
  return data ?? []
}
