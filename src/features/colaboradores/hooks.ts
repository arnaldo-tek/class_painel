import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchColaboradores, createColaborador, updateColaborador, deleteColaborador } from './api'
import type { ColaboradorFormData } from './api'

export function useColaboradores() {
  return useQuery({ queryKey: ['colaboradores'], queryFn: fetchColaboradores })
}

export function useCreateColaborador() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createColaborador,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['colaboradores'] }),
  })
}

export function useUpdateColaborador() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, ...data }: Omit<ColaboradorFormData, 'email' | 'password'> & { userId: string }) =>
      updateColaborador(userId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['colaboradores'] }),
  })
}

export function useDeleteColaborador() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteColaborador,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['colaboradores'] }),
  })
}
