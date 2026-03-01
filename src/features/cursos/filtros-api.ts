import { supabase } from '@/lib/supabase'

export async function fetchCategoriaComFiltros(id: string) {
  const { data, error } = await supabase
    .from('categorias')
    .select('id, nome, filtro_estado, filtro_cidade, filtro_orgao, filtro_escolaridade, filtro_nivel, filtro_cargo, filtro_disciplina, filtro_orgao_editais_noticias')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function fetchEstados() {
  const { data, error } = await supabase
    .from('estados')
    .select('id, nome, uf')
    .order('nome')

  if (error) throw error
  return data ?? []
}

export async function fetchMunicipios(estadoId: string) {
  const { data, error } = await supabase
    .from('municipios')
    .select('id, nome')
    .eq('estado_id', estadoId)
    .order('nome')

  if (error) throw error
  return data ?? []
}

export async function fetchEscolaridades() {
  const { data, error } = await supabase
    .from('escolaridades')
    .select('id, nome')
    .order('nome')

  if (error) throw error
  return data ?? []
}

export async function fetchNiveis() {
  const { data, error } = await supabase
    .from('niveis')
    .select('id, nome')
    .order('nome')

  if (error) throw error
  return data ?? []
}

interface OrgaosFilters {
  categoriaId?: string
  estadoId?: string
  municipioId?: string
  escolaridadeId?: string
}

export async function fetchOrgaos(filters: OrgaosFilters) {
  let query = supabase
    .from('orgaos')
    .select('id, nome')
    .order('nome')

  if (filters.categoriaId) query = query.eq('categoria_id', filters.categoriaId)

  // Build combined OR for estado + municipio to avoid multiple .or() calls
  const orParts: string[] = []
  if (filters.estadoId) {
    orParts.push(`estado_id.eq.${filters.estadoId}`, 'estado_id.is.null')
  }
  if (orParts.length > 0) {
    query = query.or(orParts.join(','))
  }

  // Municipio: show matching OR null (state/federal-level orgaos)
  if (filters.municipioId) {
    query = query.or(`municipio_id.eq.${filters.municipioId},municipio_id.is.null`)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

interface CargosFilters {
  orgaoId?: string
  escolaridadeId?: string
  categoriaId?: string
}

export async function fetchCargos(filters: CargosFilters) {
  let query = supabase
    .from('cargos')
    .select('id, nome')
    .order('nome')

  if (filters.orgaoId) query = query.eq('orgao_id', filters.orgaoId)
  if (filters.escolaridadeId) query = query.eq('escolaridade_id', filters.escolaridadeId)
  if (filters.categoriaId) query = query.eq('categoria_id', filters.categoriaId)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

interface DisciplinasFilters {
  cargoId?: string
  categoriaId?: string
  estadoId?: string
  municipioId?: string
  orgaoId?: string
}

export async function fetchDisciplinas(filters: DisciplinasFilters) {
  let query = supabase
    .from('disciplinas')
    .select('id, nome')
    .order('nome')

  if (filters.cargoId) query = query.eq('cargo_id', filters.cargoId)
  if (filters.categoriaId) query = query.eq('categoria_id', filters.categoriaId)
  if (filters.estadoId) query = query.eq('estado_id', filters.estadoId)
  if (filters.municipioId) query = query.eq('municipio_id', filters.municipioId)
  if (filters.orgaoId) query = query.eq('orgao_id', filters.orgaoId)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}
