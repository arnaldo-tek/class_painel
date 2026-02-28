import { useQuery } from '@tanstack/react-query'
import {
  fetchCategoriaComFiltros,
  fetchEstados,
  fetchMunicipios,
  fetchEscolaridades,
  fetchNiveis,
  fetchOrgaos,
  fetchCargos,
  fetchDisciplinas,
} from './filtros-api'

export function useCategoria(id: string | undefined) {
  return useQuery({
    queryKey: ['categoria-filtros', id],
    queryFn: () => fetchCategoriaComFiltros(id!),
    enabled: !!id,
  })
}

export function useEstados(enabled: boolean) {
  return useQuery({
    queryKey: ['curso-filter', 'estados'],
    queryFn: fetchEstados,
    enabled,
  })
}

export function useMunicipios(estadoId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['curso-filter', 'municipios', estadoId],
    queryFn: () => fetchMunicipios(estadoId!),
    enabled: enabled && !!estadoId,
  })
}

export function useEscolaridades(enabled: boolean) {
  return useQuery({
    queryKey: ['curso-filter', 'escolaridades'],
    queryFn: fetchEscolaridades,
    enabled,
  })
}

export function useNiveis(enabled: boolean) {
  return useQuery({
    queryKey: ['curso-filter', 'niveis'],
    queryFn: fetchNiveis,
    enabled,
  })
}

export function useOrgaos(
  filters: { categoriaId?: string; estadoId?: string; municipioId?: string; escolaridadeId?: string },
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['curso-filter', 'orgaos', filters],
    queryFn: () => fetchOrgaos(filters),
    enabled,
  })
}

export function useCargos(
  filters: { orgaoId?: string; escolaridadeId?: string; categoriaId?: string },
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['curso-filter', 'cargos', filters],
    queryFn: () => fetchCargos(filters),
    enabled,
  })
}

export function useDisciplinas(
  filters: { cargoId?: string; categoriaId?: string; estadoId?: string; municipioId?: string; orgaoId?: string },
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['curso-filter', 'disciplinas', filters],
    queryFn: () => fetchDisciplinas(filters),
    enabled,
  })
}
