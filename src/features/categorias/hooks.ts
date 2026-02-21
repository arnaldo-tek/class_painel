import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchCategorias, fetchCategoria, createCategoria, updateCategoria, deleteCategoria,
} from './api'

export function useCategorias(tipo?: string) {
  return useQuery({
    queryKey: ['categorias', tipo],
    queryFn: () => fetchCategorias(tipo),
  })
}

export function useCategoria(id: string | undefined) {
  return useQuery({
    queryKey: ['categoria', id],
    queryFn: () => fetchCategoria(id!),
    enabled: !!id,
  })
}

export function useCreateCategoria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createCategoria,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categorias'] }),
  })
}

export function useUpdateCategoria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Record<string, unknown>) =>
      updateCategoria(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categorias'] }),
  })
}

export function useDeleteCategoria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteCategoria,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categorias'] }),
  })
}
