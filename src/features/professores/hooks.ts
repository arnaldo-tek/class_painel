import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApprovalStatus } from '@/types/enums'
import {
  fetchProfessores, fetchProfessor, updateProfessorStatus, updateProfessor,
  fetchProfessorCursos,
} from './api'

export function useProfessores(status?: ApprovalStatus) {
  return useQuery({
    queryKey: ['professores', status],
    queryFn: () => fetchProfessores(status),
  })
}

export function useProfessor(id: string | undefined) {
  return useQuery({
    queryKey: ['professor', id],
    queryFn: () => fetchProfessor(id!),
    enabled: !!id,
  })
}

export function useProfessorCursos(professorId: string | undefined) {
  return useQuery({
    queryKey: ['professor-cursos', professorId],
    queryFn: () => fetchProfessorCursos(professorId!),
    enabled: !!professorId,
  })
}

export function useUpdateProfessorStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApprovalStatus }) =>
      updateProfessorStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['professores'] }),
  })
}

export function useUpdateProfessor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Record<string, unknown>) =>
      updateProfessor(id, updates),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['professores'] })
      qc.invalidateQueries({ queryKey: ['professor', v.id] })
    },
  })
}
