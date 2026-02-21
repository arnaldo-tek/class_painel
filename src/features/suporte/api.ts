import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'

export type Chamado = Tables<'chamados'> & {
  profiles: { email: string; display_name: string | null } | null
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
