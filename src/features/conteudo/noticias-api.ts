import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'

export type Noticia = Tables<'noticias'>

export async function fetchNoticias() {
  const { data, error } = await supabase
    .from('noticias')
    .select('*, categorias(nome)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createNoticia(n: Omit<Noticia, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('noticias').insert(n).select().single()
  if (error) throw error
  return data
}

export async function updateNoticia(id: string, updates: Partial<Noticia>) {
  const { data, error } = await supabase.from('noticias').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteNoticia(id: string) {
  const { error } = await supabase.from('noticias').delete().eq('id', id)
  if (error) throw error
}

// Editais
export type Edital = Tables<'editais'>

export async function fetchEditais() {
  const { data, error } = await supabase
    .from('editais')
    .select('*, categorias(nome), professor_profiles(nome_professor)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createEdital(e: Omit<Edital, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('editais').insert(e).select().single()
  if (error) throw error
  return data
}

export async function updateEdital(id: string, updates: Partial<Edital>) {
  const { data, error } = await supabase.from('editais').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteEdital(id: string) {
  const { error } = await supabase.from('editais').delete().eq('id', id)
  if (error) throw error
}
