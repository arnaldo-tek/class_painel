import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'

export type Comunidade = Tables<'comunidades'>
export type ComunidadeMembro = Tables<'comunidade_membros'>
export type ComunidadeMensagem = Tables<'comunidade_mensagens'>

export interface ComunidadeWithCategoria extends Comunidade {
  categorias: { nome: string } | null
  _count_membros?: number
}

export interface MembroWithProfile extends ComunidadeMembro {
  profiles: { display_name: string | null; email: string | null; photo_url: string | null } | null
}

export interface MensagemWithProfile extends ComunidadeMensagem {
  profiles: { display_name: string | null; photo_url: string | null } | null
}

// --- Comunidades ---

export async function fetchComunidades() {
  const { data, error } = await supabase
    .from('comunidades')
    .select('*, categorias(nome)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ComunidadeWithCategoria[]
}

export async function fetchComunidade(id: string) {
  const { data, error } = await supabase
    .from('comunidades')
    .select('*, categorias(nome)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as ComunidadeWithCategoria
}

export async function createComunidade(c: { nome: string; imagem?: string | null; categoria_id?: string | null }) {
  const { data, error } = await supabase.from('comunidades').insert(c).select().single()
  if (error) throw error
  return data
}

export async function updateComunidade(id: string, updates: Partial<Comunidade>) {
  const { data, error } = await supabase.from('comunidades').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteComunidade(id: string) {
  const { error } = await supabase.from('comunidades').delete().eq('id', id)
  if (error) throw error
}

// --- Membros ---

export async function fetchMembros(comunidadeId: string) {
  const { data, error } = await supabase
    .from('comunidade_membros')
    .select('*, profiles(nome, email, foto)')
    .eq('comunidade_id', comunidadeId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as MembroWithProfile[]
}

export async function suspenderMembro(id: string, suspenso: boolean) {
  const { data, error } = await supabase
    .from('comunidade_membros')
    .update({ suspenso })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function removeMembro(id: string) {
  const { error } = await supabase.from('comunidade_membros').delete().eq('id', id)
  if (error) throw error
}

// --- Mensagens ---

export async function fetchMensagens(comunidadeId: string) {
  const { data, error } = await supabase
    .from('comunidade_mensagens')
    .select('*, profiles(nome, foto)')
    .eq('comunidade_id', comunidadeId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as MensagemWithProfile[]
}

export async function deleteMensagem(id: string) {
  const { error } = await supabase.from('comunidade_mensagens').delete().eq('id', id)
  if (error) throw error
}
