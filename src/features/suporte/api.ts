import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'

export type Chamado = Tables<'chamados'> & {
  profiles: { email: string; display_name: string | null } | null
}

export interface ChamadoMensagem {
  id: string
  chamado_id: string
  user_id: string
  mensagem: string
  created_at: string | null
}

export async function fetchChamados(tipo: 'aluno' | 'professor', statusFilter?: string) {
  let query = supabase
    .from('chamados')
    .select('*, profiles(email, display_name)')
    .order('created_at', { ascending: false })

  if (tipo === 'aluno') query = query.eq('is_suporte_aluno', true)
  else query = query.eq('is_suporte_professor', true)

  if (statusFilter) query = query.eq('status', statusFilter)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Chamado[]
}

export async function updateChamadoStatus(id: string, status: string) {
  const { error } = await supabase.from('chamados').update({ status }).eq('id', id)
  if (error) throw error
}

export async function fetchChamadoMensagens(chamadoId: string) {
  const { data, error } = await supabase
    .from('chamado_mensagens')
    .select('id, chamado_id, user_id, mensagem, created_at')
    .eq('chamado_id', chamadoId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as ChamadoMensagem[]
}

export async function sendChamadoMensagem(chamadoId: string, mensagem: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { error } = await supabase.from('chamado_mensagens').insert({
    chamado_id: chamadoId,
    user_id: user.id,
    mensagem,
  })
  if (error) throw error
}
