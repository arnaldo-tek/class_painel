import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'

export type Pacote = Tables<'pacotes'>

export type PacoteWithRelations = Pacote & {
  pacote_cursos: { curso_id: string; cursos: { nome: string } | null }[]
  pacote_categorias: { categoria_id: string; categorias: { id: string; nome: string } | null }[]
}

export async function fetchPacotes() {
  const { data, error } = await supabase
    .from('pacotes')
    .select('*, pacote_cursos(curso_id, cursos(nome)), pacote_categorias(categoria_id, categorias(id, nome))')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as PacoteWithRelations[]
}

export async function fetchPacote(id: string) {
  const { data, error } = await supabase
    .from('pacotes')
    .select('*, pacote_cursos(curso_id, cursos(nome)), pacote_categorias(categoria_id, categorias(id, nome))')
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
  // Check if course professor has Pagar.me receiver_id
  const { data: curso } = await supabase
    .from('cursos')
    .select('professor_id, professor_profiles!cursos_professor_id_fkey(pagarme_receiver_id, nome_professor)')
    .eq('id', cursoId)
    .single()

  const prof = curso?.professor_profiles as unknown as { pagarme_receiver_id: string | null; nome_professor: string } | null
  if (!prof?.pagarme_receiver_id) {
    throw new Error(
      `O professor "${prof?.nome_professor ?? 'desconhecido'}" não possui conta cadastrada no Pagar.me. Configure os dados bancários do professor antes de adicioná-lo a um pacote.`
    )
  }

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

export async function addCategoriaToPacote(pacoteId: string, categoriaId: string) {
  const { error } = await supabase
    .from('pacote_categorias')
    .insert({ pacote_id: pacoteId, categoria_id: categoriaId })
  if (error) throw error
}

export async function removeCategoriaFromPacote(pacoteId: string, categoriaId: string) {
  const { error } = await supabase
    .from('pacote_categorias')
    .delete()
    .eq('pacote_id', pacoteId)
    .eq('categoria_id', categoriaId)
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
