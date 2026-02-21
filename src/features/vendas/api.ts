import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'
import type { OrderStatus } from '@/types/enums'

export type Movimentacao = Tables<'movimentacoes'>

export interface VendasFilters {
  status?: OrderStatus
  professorId?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  perPage?: number
}

export async function fetchVendas(filters: VendasFilters) {
  const { status, professorId, dateFrom, dateTo, page = 1, perPage = 20 } = filters

  let query = supabase
    .from('movimentacoes')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (professorId) query = query.eq('professor_id', professorId)
  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')

  const from = (page - 1) * perPage
  query = query.range(from, from + perPage - 1)

  const { data, error, count } = await query
  if (error) throw error
  return {
    vendas: (data ?? []) as Movimentacao[],
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / perPage),
  }
}

export async function fetchResumoVendas() {
  const { data, error } = await supabase
    .from('movimentacoes')
    .select('valor, taxa_plataforma, status')

  if (error) throw error

  const paid = (data ?? []).filter((m) => m.status === 'paid')
  const totalReceita = paid.reduce((s, m) => s + Number(m.valor ?? 0), 0)
  const totalPlataforma = paid.reduce((s, m) => s + Number(m.taxa_plataforma ?? 0), 0)
  const totalProfessores = totalReceita - totalPlataforma
  const totalVendas = paid.length

  return { totalReceita, totalPlataforma, totalProfessores, totalVendas }
}

// === Cupons ===

export type Cupom = Tables<'cupons'>

export async function fetchCupons() {
  const { data, error } = await supabase
    .from('cupons')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createCupom(cupom: { codigo: string; valor: number; max_uses?: number | null; valid_until?: string | null }) {
  const { data, error } = await supabase
    .from('cupons')
    .insert(cupom)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCupom(id: string, updates: Partial<Cupom>) {
  const { data, error } = await supabase
    .from('cupons')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCupom(id: string) {
  const { error } = await supabase.from('cupons').delete().eq('id', id)
  if (error) throw error
}
