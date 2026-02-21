import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'

export type Pacote = Tables<'pacotes'>

export type PacoteWithRelations = Pacote & {
  pacote_cursos: { curso_id: string; cursos: { nome: string } | null }[]
}

export async function fetchPacotes() {
  const { data, error } = await supabase
    .from('pacotes')
    .select('*, pacote_cursos(curso_id, cursos(nome))')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as PacoteWithRelations[]
}

export async function fetchPacote(id: string) {
  const { data, error } = await supabase
    .from('pacotes')
    .select('*, pacote_cursos(curso_id, cursos(nome))')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as PacoteWithRelations
}

export async function createPacote(pacote: { nome: string; descricao?: string | null; preco?: number; imagem?: string | null }) {
  const { data, error } = await supabase
    .from('pacotes')
    .insert(pacote)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePacote(id: string, updates: Partial<Pacote>) {
  const { data, error } = await supabase
    .from('pacotes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePacote(id: string) {
  const { error } = await supabase.from('pacotes').delete().eq('id', id)
  if (error) throw error
}

export async function addCursoToPacote(pacoteId: string, cursoId: string) {
  const { error } = await supabase
    .from('pacote_cursos')
    .insert({ pacote_id: pacoteId, curso_id: cursoId })
  if (error) throw error
}

export async function removeCursoFromPacote(pacoteId: string, cursoId: string) {
  const { error } = await supabase
    .from('pacote_cursos')
    .delete()
    .eq('pacote_id', pacoteId)
    .eq('curso_id', cursoId)
  if (error) throw error
}

export async function fetchAllCursos() {
  const { data, error } = await supabase
    .from('cursos')
    .select('id, nome')
    .eq('is_publicado', true)
    .order('nome')

  if (error) throw error
  return data ?? []
}
