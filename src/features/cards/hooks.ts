import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchCards, createCard, updateCard, deleteCard } from './api'
import type { PostProfessor } from './api'

export function useCards(professorId: string | undefined) {
  return useQuery({
    queryKey: ['cards', professorId],
    queryFn: () => fetchCards(professorId!),
    enabled: !!professorId,
  })
}

export function useCreateCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createCard,
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cards', v.professor_id] }),
  })
}

export function useUpdateCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<PostProfessor>) =>
      updateCard(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cards'] }),
  })
}

export function useDeleteCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteCard,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cards'] }),
  })
}
