import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAlunos, fetchAlunoEnrollments, toggleAlunoSuspended } from './api'

export function useAlunos(search?: string, page = 1) {
  return useQuery({
    queryKey: ['alunos', search, page],
    queryFn: () => fetchAlunos(search, page),
  })
}

export function useAlunoEnrollments(userId: string | undefined) {
  return useQuery({
    queryKey: ['aluno-enrollments', userId],
    queryFn: () => fetchAlunoEnrollments(userId!),
    enabled: !!userId,
  })
}

export function useToggleAlunoSuspended() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, isSuspended }: { userId: string; isSuspended: boolean }) =>
      toggleAlunoSuspended(userId, isSuspended),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alunos'] }),
  })
}
