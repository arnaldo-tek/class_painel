import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'

export type PostProfessor = Tables<'post_professores'>

export async function fetchCards(professorId: string) {
  const { data, error } = await supabase
    .from('post_professores')
    .select('*')
    .eq('professor_id', professorId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createCard(card: {
  professor_id: string
  titulo?: string | null
  descricao?: string | null
  imagem?: string | null
  video?: string | null
}) {
  const { data, error } = await supabase
    .from('post_professores')
    .insert(card)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCard(id: string, updates: Partial<PostProfessor>) {
  const { data, error } = await supabase
    .from('post_professores')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCard(id: string) {
  const { error } = await supabase.from('post_professores').delete().eq('id', id)
  if (error) throw error
}
