import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchFaqs, createFaq, updateFaq, deleteFaq } from './api'
import type { Faq } from './api'

export function useFaqs() {
  return useQuery({ queryKey: ['faqs'], queryFn: fetchFaqs })
}

export function useCreateFaq() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createFaq,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['faqs'] }),
  })
}

export function useUpdateFaq() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<Faq>) => updateFaq(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['faqs'] }),
  })
}

export function useDeleteFaq() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteFaq,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['faqs'] }),
  })
}
