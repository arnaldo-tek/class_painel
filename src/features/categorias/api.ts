import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'

export type Categoria = Tables<'categorias'>

export const TIPOS_CATEGORIA = [
  { value: 'curso', label: 'Curso' },
  { value: 'noticia', label: 'Notícia' },
  { value: 'edital', label: 'Edital' },
  { value: 'pacote', label: 'Pacote' },
] as const

export async function fetchCategorias(tipo?: string) {
  let query = supabase
    .from('categorias')
    .select('*', { count: 'exact' })
    .order('nome')

  if (tipo) {
    query = query.eq('tipo', tipo)
  }

  const { data, error, count } = await query
  if (error) throw error
  return { categorias: data ?? [], total: count ?? 0 }
}

export async function fetchCategoria(id: string) {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Categoria
}

export async function createCategoria(cat: Omit<Categoria, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('categorias')
    .insert(cat)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCategoria(id: string, updates: Partial<Categoria>) {
  const { data, error } = await supabase
    .from('categorias')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCategoria(id: string) {
  const { error } = await supabase.from('categorias').delete().eq('id', id)
  if (error) throw error
}

