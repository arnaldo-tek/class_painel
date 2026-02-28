import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchVendas, fetchVendasMovimentacoes, fetchResumoVendas, fetchCupons, createCupom, updateCupom, deleteCupom,
  fetchVendasPorProfessor, fetchVendasPorCategoria,
  fetchVendasDetalheProfessor, fetchVendasDetalheCategoria,
  fetchVendasParaExportar,
  type VendasFilters, type VendasResult,
} from './api'

export function useVendas(filters: VendasFilters) {
  return useQuery<VendasResult>({
    queryKey: ['vendas', filters],
    queryFn: () => fetchVendasMovimentacoes(filters),
  })
}

export function useResumoVendas(dateFrom?: string, dateTo?: string, professorId?: string) {
  return useQuery({
    queryKey: ['resumo-vendas', dateFrom, dateTo, professorId],
    queryFn: () => fetchResumoVendas(dateFrom, dateTo, professorId),
  })
}

export function useVendasPorProfessor(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['vendas-por-professor', dateFrom, dateTo],
    queryFn: () => fetchVendasPorProfessor(dateFrom, dateTo),
  })
}

export function useVendasPorCategoria(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['vendas-por-categoria', dateFrom, dateTo],
    queryFn: () => fetchVendasPorCategoria(dateFrom, dateTo),
  })
}

export function useVendasDetalheProfessor(professorId: string | null, dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['vendas-detalhe-professor', professorId, dateFrom, dateTo],
    queryFn: () => fetchVendasDetalheProfessor(professorId!, dateFrom, dateTo),
    enabled: !!professorId,
  })
}

export function useVendasDetalheCategoria(categoriaId: string | null, dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['vendas-detalhe-categoria', categoriaId, dateFrom, dateTo],
    queryFn: () => fetchVendasDetalheCategoria(categoriaId!, dateFrom, dateTo),
    enabled: !!categoriaId,
  })
}

export function useVendasParaExportar(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['vendas-exportar', dateFrom, dateTo],
    queryFn: () => fetchVendasParaExportar(dateFrom, dateTo),
    enabled: false,
  })
}

export function useCupons() {
  return useQuery({ queryKey: ['cupons'], queryFn: fetchCupons })
}

export function useCreateCupom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createCupom,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cupons'] }),
  })
}

export function useUpdateCupom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Record<string, unknown>) =>
      updateCupom(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cupons'] }),
  })
}

export function useDeleteCupom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteCupom,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cupons'] }),
  })
}
