import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'
import type { OrderStatus } from '@/types/enums'

export type Movimentacao = Tables<'movimentacoes'>

// === Pagar.me Orders (source of truth) ===

export interface PagarmeOrder {
  id: string
  code: string
  amount: number
  status: string
  created_at: string
  updated_at: string
  customer: { id: string; name: string; email: string } | null
  charges: Array<{
    id: string
    amount: number
    status: string
    payment_method: string
    paid_at: string | null
  }>
  items: Array<{
    amount: number
    description: string
    quantity: number
    code: string
  }>
}

export interface VendasFilters {
  search?: string
  status?: string
  professorId?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  perPage?: number
}

export async function fetchVendas(filters: VendasFilters) {
  const { status, dateFrom, dateTo, page = 1, perPage = 20 } = filters

  const body: Record<string, unknown> = {
    page,
    size: perPage,
  }
  if (status) body.status = status
  if (dateFrom) body.created_since = `${dateFrom}T00:00:00`
  if (dateTo) body.created_until = `${dateTo}T23:59:59`

  const { data: result, error } = await supabase.functions.invoke('payment-orders', { body })
  if (error) throw new Error(error.message)
  if (result?.error) throw new Error(result.error)

  const orders = (result?.data ?? []) as PagarmeOrder[]
  const total = result?.paging?.total ?? orders.length

  return {
    vendas: orders,
    total,
    totalPages: Math.ceil(total / perPage),
  }
}

export async function fetchResumoVendas(dateFrom?: string, dateTo?: string, professorId?: string) {
  let query = supabase
    .from('movimentacoes')
    .select('valor, taxa_plataforma, status')
    .eq('status', 'paid')

  if (professorId) query = query.eq('professor_id', professorId)
  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')

  const { data, error } = await query
  if (error) throw error

  const paid = data ?? []
  const totalReceita = paid.reduce((s, m) => s + Number(m.valor ?? 0), 0)
  const totalPlataforma = paid.reduce((s, m) => s + Number(m.taxa_plataforma ?? 0), 0)
  const totalProfessores = totalReceita - totalPlataforma
  const totalVendas = paid.length

  return { totalReceita, totalPlataforma, totalProfessores, totalVendas }
}

// === Vendas por Professor ===

export interface VendaPorProfessor {
  professor_id: string
  nome_professor: string
  foto_url: string | null
  total_vendas: number
  fat_total: number
  fat_professor: number
  fat_plataforma: number
}

export async function fetchVendasPorProfessor(dateFrom: string, dateTo: string): Promise<VendaPorProfessor[]> {
  let query = supabase
    .from('movimentacoes')
    .select('professor_id, valor, taxa_plataforma, professor_profiles!movimentacoes_professor_id_fkey(nome_professor, foto_perfil)')
    .eq('status', 'paid')
    .not('professor_id', 'is', null)

  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')

  const { data, error } = await query
  if (error) throw error

  const grouped = new Map<string, VendaPorProfessor>()
  for (const row of data ?? []) {
    const pid = row.professor_id!
    const prof = row.professor_profiles as unknown as { nome_professor: string; foto_perfil: string | null } | null
    const existing = grouped.get(pid)
    const valor = Number(row.valor ?? 0)
    const taxa = Number(row.taxa_plataforma ?? 0)
    if (existing) {
      existing.total_vendas += 1
      existing.fat_total += valor
      existing.fat_plataforma += taxa
      existing.fat_professor += valor - taxa
    } else {
      grouped.set(pid, {
        professor_id: pid,
        nome_professor: prof?.nome_professor ?? 'Professor',
        foto_url: prof?.foto_perfil ?? null,
        total_vendas: 1,
        fat_total: valor,
        fat_plataforma: taxa,
        fat_professor: valor - taxa,
      })
    }
  }

  return Array.from(grouped.values()).sort((a, b) => b.fat_total - a.fat_total)
}

// === Detalhe vendas de 1 professor ===

export interface VendaDetalheProfessor {
  curso_id: string | null
  nome_curso: string
  total_vendas: number
  fat_total: number
  fat_professor: number
  fat_plataforma: number
}

export async function fetchVendasDetalheProfessor(
  professorId: string,
  dateFrom: string,
  dateTo: string,
): Promise<VendaDetalheProfessor[]> {
  let query = supabase
    .from('movimentacoes')
    .select('curso_id, nome_curso, valor, taxa_plataforma')
    .eq('status', 'paid')
    .eq('professor_id', professorId)

  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')

  const { data, error } = await query
  if (error) throw error

  const grouped = new Map<string, VendaDetalheProfessor>()
  for (const row of data ?? []) {
    const key = row.curso_id ?? 'sem-curso'
    const existing = grouped.get(key)
    const valor = Number(row.valor ?? 0)
    const taxa = Number(row.taxa_plataforma ?? 0)
    if (existing) {
      existing.total_vendas += 1
      existing.fat_total += valor
      existing.fat_plataforma += taxa
      existing.fat_professor += valor - taxa
    } else {
      grouped.set(key, {
        curso_id: row.curso_id,
        nome_curso: row.nome_curso ?? 'Curso removido',
        total_vendas: 1,
        fat_total: valor,
        fat_plataforma: taxa,
        fat_professor: valor - taxa,
      })
    }
  }

  return Array.from(grouped.values()).sort((a, b) => b.fat_total - a.fat_total)
}

// === Vendas por Categoria ===

export interface VendaPorCategoria {
  categoria_id: string
  nome_categoria: string
  total_vendas: number
  fat_total: number
  fat_professor: number
  fat_plataforma: number
}

export async function fetchVendasPorCategoria(dateFrom: string, dateTo: string): Promise<VendaPorCategoria[]> {
  let query = supabase
    .from('movimentacoes')
    .select('valor, taxa_plataforma, cursos!movimentacoes_curso_id_fkey(categoria_id, categorias!cursos_categoria_id_fkey(id, nome))')
    .eq('status', 'paid')
    .not('curso_id', 'is', null)

  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')

  const { data, error } = await query
  if (error) throw error

  const grouped = new Map<string, VendaPorCategoria>()
  for (const row of data ?? []) {
    const curso = row.cursos as unknown as { categoria_id: string | null; categorias: { id: string; nome: string } | null } | null
    const catId = curso?.categorias?.id ?? 'sem-categoria'
    const catNome = curso?.categorias?.nome ?? 'Sem categoria'
    const existing = grouped.get(catId)
    const valor = Number(row.valor ?? 0)
    const taxa = Number(row.taxa_plataforma ?? 0)
    if (existing) {
      existing.total_vendas += 1
      existing.fat_total += valor
      existing.fat_plataforma += taxa
      existing.fat_professor += valor - taxa
    } else {
      grouped.set(catId, {
        categoria_id: catId,
        nome_categoria: catNome,
        total_vendas: 1,
        fat_total: valor,
        fat_plataforma: taxa,
        fat_professor: valor - taxa,
      })
    }
  }

  return Array.from(grouped.values()).sort((a, b) => b.fat_total - a.fat_total)
}

// === Detalhe vendas de 1 categoria ===

export interface VendaDetalheCategoria {
  curso_id: string | null
  nome_curso: string
  total_vendas: number
  fat_total: number
  fat_professor: number
  fat_plataforma: number
}

export async function fetchVendasDetalheCategoria(
  categoriaId: string,
  dateFrom: string,
  dateTo: string,
): Promise<VendaDetalheCategoria[]> {
  let query = supabase
    .from('movimentacoes')
    .select('curso_id, nome_curso, valor, taxa_plataforma, cursos!movimentacoes_curso_id_fkey(categoria_id)')
    .eq('status', 'paid')
    .not('curso_id', 'is', null)

  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')

  const { data, error } = await query
  if (error) throw error

  const filtered = (data ?? []).filter((row) => {
    const curso = row.cursos as unknown as { categoria_id: string | null } | null
    return curso?.categoria_id === categoriaId
  })

  const grouped = new Map<string, VendaDetalheCategoria>()
  for (const row of filtered) {
    const key = row.curso_id ?? 'sem-curso'
    const existing = grouped.get(key)
    const valor = Number(row.valor ?? 0)
    const taxa = Number(row.taxa_plataforma ?? 0)
    if (existing) {
      existing.total_vendas += 1
      existing.fat_total += valor
      existing.fat_plataforma += taxa
      existing.fat_professor += valor - taxa
    } else {
      grouped.set(key, {
        curso_id: row.curso_id,
        nome_curso: row.nome_curso ?? 'Curso removido',
        total_vendas: 1,
        fat_total: valor,
        fat_plataforma: taxa,
        fat_professor: valor - taxa,
      })
    }
  }

  return Array.from(grouped.values()).sort((a, b) => b.fat_total - a.fat_total)
}

// === Exportar todas as vendas para Excel ===

export async function fetchVendasParaExportar(dateFrom?: string, dateTo?: string) {
  let query = supabase
    .from('movimentacoes')
    .select('pagarme_order_id, valor, nome_curso, valor_curso, nome_cliente, email_cliente, contato_cliente, created_at, taxa_plataforma, status')
    .order('created_at', { ascending: false })

  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')

  const { data, error } = await query
  if (error) throw error
  return data ?? []
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
