import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchVendas, fetchResumoVendas, fetchCupons, createCupom, updateCupom, deleteCupom,
  type VendasFilters,
} from './api'

export function useVendas(filters: VendasFilters) {
  return useQuery({
    queryKey: ['vendas', filters],
    queryFn: () => fetchVendas(filters),
  })
}

export function useResumoVendas() {
  return useQuery({
    queryKey: ['resumo-vendas'],
    queryFn: fetchResumoVendas,
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
