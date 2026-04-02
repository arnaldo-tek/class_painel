import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'

export type Estado = Tables<'estados'>
export type Municipio = Tables<'municipios'>
export type Esfera = Tables<'esferas'>
export type Escolaridade = Tables<'escolaridades'>
export type Nivel = Tables<'niveis'>

// Tipos com joins para exibição
export interface Orgao {
  id: string
  nome: string
  categoria_id: string | null
  esfera_id: string | null
  estado_id: string | null
  municipio_id: string | null
  escolaridade_id: string | null
  categoria_nome: string | null
  esfera_nome: string | null
  estado_nome: string | null
  municipio_nome: string | null
  escolaridade_nome: string | null
}

export interface Cargo {
  id: string
  nome: string
  categoria_id: string | null
  escolaridade_id: string | null
  orgao_id: string | null
  categoria_nome: string | null
  escolaridade_nome: string | null
  orgao_nome: string | null
}

export interface Disciplina {
  id: string
  nome: string
  categoria_id: string | null
  esfera_id: string | null
  estado_id: string | null
  municipio_id: string | null
  orgao_id: string | null
  cargo_id: string | null
  nivel_id: string | null
  categoria_nome: string | null
  esfera_nome: string | null
  estado_nome: string | null
  municipio_nome: string | null
  orgao_nome: string | null
  cargo_nome: string | null
  nivel_nome: string | null
}

// --- Estados (somente leitura) ---

export async function fetchEstados() {
  const { data, error, count } = await supabase
    .from('estados')
    .select('*', { count: 'exact' })
    .order('nome')
  if (error) throw error
  return { items: data ?? [], total: count ?? 0 }
}

// --- Municípios (somente leitura) ---

export async function fetchMunicipios(estadoId?: string, page = 1, perPage = 50) {
  let query = supabase
    .from('municipios')
    .select('*', { count: 'exact' })
    .order('nome')

  if (estadoId) {
    query = query.eq('estado_id', estadoId)
  }

  const from = (page - 1) * perPage
  query = query.range(from, from + perPage - 1)

  const { data, error, count } = await query
  if (error) throw error
  return { items: data ?? [], total: count ?? 0 }
}

export async function fetchMunicipiosByEstado(estadoId: string) {
  const { data, error } = await supabase
    .from('municipios')
    .select('id, nome')
    .eq('estado_id', estadoId)
    .order('nome')
    .limit(10000)
  if (error) throw error
  return data ?? []
}

// --- Esferas ---

export async function fetchEsferas() {
  const { data, error, count } = await supabase
    .from('esferas')
    .select('*', { count: 'exact' })
    .order('nome')
  if (error) throw error
  return { items: data ?? [], total: count ?? 0 }
}

export async function createEsfera(esfera: { nome: string }) {
  const { data, error } = await supabase.from('esferas').insert(esfera).select().single()
  if (error) throw error
  return data
}

export async function updateEsfera(id: string, updates: Partial<Esfera>) {
  const { data, error } = await supabase.from('esferas').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteEsfera(id: string) {
  const { error } = await supabase.from('esferas').delete().eq('id', id)
  if (error) throw error
}

// --- Escolaridades ---

export async function fetchEscolaridades() {
  const { data, error, count } = await supabase
    .from('escolaridades')
    .select('*', { count: 'exact' })
    .order('nome')
  if (error) throw error
  return { items: data ?? [], total: count ?? 0 }
}

export async function createEscolaridade(escolaridade: { nome: string }) {
  const { data, error } = await supabase.from('escolaridades').insert(escolaridade).select().single()
  if (error) throw error
  return data
}

export async function updateEscolaridade(id: string, updates: Partial<Escolaridade>) {
  const { data, error } = await supabase.from('escolaridades').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteEscolaridade(id: string) {
  const { error } = await supabase.from('escolaridades').delete().eq('id', id)
  if (error) throw error
}

// --- Níveis ---

export async function fetchNiveis() {
  const { data, error, count } = await supabase
    .from('niveis')
    .select('*', { count: 'exact' })
    .order('nome')
  if (error) throw error
  return { items: data ?? [], total: count ?? 0 }
}

export async function createNivel(nivel: { nome: string }) {
  const { data, error } = await supabase.from('niveis').insert(nivel).select().single()
  if (error) throw error
  return data
}

export async function updateNivel(id: string, updates: Partial<Nivel>) {
  const { data, error } = await supabase.from('niveis').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteNivel(id: string) {
  const { error } = await supabase.from('niveis').delete().eq('id', id)
  if (error) throw error
}

// --- Órgãos (com joins) ---

export async function fetchOrgaos() {
  const { data, error, count } = await supabase
    .from('orgaos')
    .select(`
      id, nome, categoria_id, esfera_id, estado_id, municipio_id, escolaridade_id,
      categorias(nome),
      esferas(nome),
      estados(nome),
      municipios(nome),
      escolaridades(nome)
    `, { count: 'exact' })
    .order('nome')
  if (error) throw error
  const items: Orgao[] = (data ?? []).map((o: any) => ({
    id: o.id,
    nome: o.nome,
    categoria_id: o.categoria_id,
    esfera_id: o.esfera_id,
    estado_id: o.estado_id,
    municipio_id: o.municipio_id,
    escolaridade_id: o.escolaridade_id,
    categoria_nome: o.categorias?.nome ?? null,
    esfera_nome: o.esferas?.nome ?? null,
    estado_nome: o.estados?.nome ?? null,
    municipio_nome: o.municipios?.nome ?? null,
    escolaridade_nome: o.escolaridades?.nome ?? null,
  }))
  return { items, total: count ?? 0 }
}

export async function createOrgao(orgao: Omit<Tables<'orgaos'>, 'id'>) {
  const { data, error } = await supabase.from('orgaos').insert(orgao).select().single()
  if (error) throw error
  return data
}

export async function updateOrgao(id: string, updates: Partial<Tables<'orgaos'>>) {
  const { data, error } = await supabase.from('orgaos').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteOrgao(id: string) {
  const { error } = await supabase.from('orgaos').delete().eq('id', id)
  if (error) throw error
}

// --- Cargos (com joins) ---

export async function fetchCargos() {
  const { data, error, count } = await supabase
    .from('cargos')
    .select(`
      id, nome, categoria_id, escolaridade_id, orgao_id,
      categorias(nome),
      escolaridades(nome),
      orgaos(nome)
    `, { count: 'exact' })
    .order('nome')
  if (error) throw error
  const items: Cargo[] = (data ?? []).map((c: any) => ({
    id: c.id,
    nome: c.nome,
    categoria_id: c.categoria_id,
    escolaridade_id: c.escolaridade_id,
    orgao_id: c.orgao_id,
    categoria_nome: c.categorias?.nome ?? null,
    escolaridade_nome: c.escolaridades?.nome ?? null,
    orgao_nome: c.orgaos?.nome ?? null,
  }))
  return { items, total: count ?? 0 }
}

export async function createCargo(cargo: Omit<Tables<'cargos'>, 'id'>) {
  const { data, error } = await supabase.from('cargos').insert(cargo).select().single()
  if (error) throw error
  return data
}

export async function updateCargo(id: string, updates: Partial<Tables<'cargos'>>) {
  const { data, error } = await supabase.from('cargos').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteCargo(id: string) {
  const { error } = await supabase.from('cargos').delete().eq('id', id)
  if (error) throw error
}

// --- Disciplinas (com joins) ---

export async function fetchDisciplinas() {
  const { data, error, count } = await supabase
    .from('disciplinas')
    .select(`
      id, nome, categoria_id, esfera_id, estado_id, municipio_id, orgao_id, cargo_id, nivel_id,
      categorias(nome),
      esferas(nome),
      estados(nome),
      municipios(nome),
      orgaos(nome),
      cargos(nome),
      niveis(nome)
    `, { count: 'exact' })
    .order('nome')
  if (error) throw error
  const items: Disciplina[] = (data ?? []).map((d: any) => ({
    id: d.id,
    nome: d.nome,
    categoria_id: d.categoria_id,
    esfera_id: d.esfera_id,
    estado_id: d.estado_id,
    municipio_id: d.municipio_id,
    orgao_id: d.orgao_id,
    cargo_id: d.cargo_id,
    nivel_id: d.nivel_id,
    categoria_nome: d.categorias?.nome ?? null,
    esfera_nome: d.esferas?.nome ?? null,
    estado_nome: d.estados?.nome ?? null,
    municipio_nome: d.municipios?.nome ?? null,
    orgao_nome: d.orgaos?.nome ?? null,
    cargo_nome: d.cargos?.nome ?? null,
    nivel_nome: d.niveis?.nome ?? null,
  }))
  return { items, total: count ?? 0 }
}

export async function createDisciplina(disciplina: Omit<Tables<'disciplinas'>, 'id'>) {
  const { data, error } = await supabase.from('disciplinas').insert(disciplina).select().single()
  if (error) throw error
  return data
}

export async function updateDisciplina(id: string, updates: Partial<Tables<'disciplinas'>>) {
  const { data, error } = await supabase.from('disciplinas').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteDisciplina(id: string) {
  const { error } = await supabase.from('disciplinas').delete().eq('id', id)
  if (error) throw error
}
