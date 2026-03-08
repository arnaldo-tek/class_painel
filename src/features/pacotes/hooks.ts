import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchPacotes, fetchPacote, createPacote, updatePacote, deletePacote,
  addCursoToPacote, removeCursoFromPacote, addCategoriaToPacote, removeCategoriaFromPacote, fetchAllCursos,
} from './api'

export function usePacotes() {
  return useQuery({ queryKey: ['pacotes'], queryFn: fetchPacotes })
}

export function usePacote(id: string | undefined) {
  return useQuery({
    queryKey: ['pacote', id],
    queryFn: () => fetchPacote(id!),
    enabled: !!id,
  })
}

export function useAllCursos() {
  return useQuery({ queryKey: ['all-cursos-simple'], queryFn: fetchAllCursos })
}

export function useCreatePacote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createPacote,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pacotes'] }),
  })
}

export function useUpdatePacote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Record<string, unknown>) =>
      updatePacote(id, updates),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['pacotes'] })
      qc.invalidateQueries({ queryKey: ['pacote', v.id] })
    },
  })
}

export function useDeletePacote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deletePacote,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pacotes'] }),
  })
}

export function useAddCursoToPacote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ pacoteId, cursoId }: { pacoteId: string; cursoId: string }) =>
      addCursoToPacote(pacoteId, cursoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pacotes'] })
      qc.invalidateQueries({ queryKey: ['pacote'] })
    },
  })
}

export function useRemoveCursoFromPacote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ pacoteId, cursoId }: { pacoteId: string; cursoId: string }) =>
      removeCursoFromPacote(pacoteId, cursoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pacotes'] })
      qc.invalidateQueries({ queryKey: ['pacote'] })
    },
  })
}

export function useAddCategoriaToPacote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ pacoteId, categoriaId }: { pacoteId: string; categoriaId: string }) =>
      addCategoriaToPacote(pacoteId, categoriaId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pacotes'] })
      qc.invalidateQueries({ queryKey: ['pacote'] })
    },
  })
}

export function useRemoveCategoriaFromPacote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ pacoteId, categoriaId }: { pacoteId: string; categoriaId: string }) =>
      removeCategoriaFromPacote(pacoteId, categoriaId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pacotes'] })
      qc.invalidateQueries({ queryKey: ['pacote'] })
    },
  })
}
