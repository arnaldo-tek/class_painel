import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchCursos, fetchCurso, createCurso, updateCurso, deleteCurso,
  fetchProfessores, fetchCategoriasCurso,
  type CursosFilters,
} from './api'

export function useCursos(filters: CursosFilters) {
  return useQuery({
    queryKey: ['cursos', filters],
    queryFn: () => fetchCursos(filters),
  })
}

export function useCurso(id: string | undefined) {
  return useQuery({
    queryKey: ['curso', id],
    queryFn: () => fetchCurso(id!),
    enabled: !!id,
  })
}

export function useProfessores() {
  return useQuery({
    queryKey: ['professores-list'],
    queryFn: fetchProfessores,
  })
}

export function useCategoriasCurso() {
  return useQuery({
    queryKey: ['categorias-curso'],
    queryFn: fetchCategoriasCurso,
  })
}

export function useCreateCurso() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createCurso,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cursos'] })
    },
  })
}

export function useUpdateCurso() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Record<string, unknown>) =>
      updateCurso(id, updates),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['cursos'] })
      qc.invalidateQueries({ queryKey: ['curso', variables.id] })
    },
  })
}

export function useDeleteCurso() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteCurso,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cursos'] })
    },
  })
}
