import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateProfessorProfile } from './api'
import type { ProfessorProfile } from './api'

export function useUpdateProfessorProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<ProfessorProfile>) =>
      updateProfessorProfile(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['professor_profile'] })
    },
  })
}
