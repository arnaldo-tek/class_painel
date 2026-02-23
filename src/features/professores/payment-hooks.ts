import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchRecipientBalance,
  fetchRecipientDetails,
  fetchTransferHistory,
  registerRecipient,
  requestTransfer,
} from './payment-api'
import type { RegisterRecipientData } from './payment-api'

export function useRecipientBalance(recipientId: string | undefined | null) {
  return useQuery({
    queryKey: ['recipient-balance', recipientId],
    queryFn: () => fetchRecipientBalance(recipientId!),
    enabled: !!recipientId,
    refetchInterval: 60_000,
  })
}

export function useRecipientDetails(recipientId: string | undefined | null) {
  return useQuery({
    queryKey: ['recipient-details', recipientId],
    queryFn: () => fetchRecipientDetails(recipientId!),
    enabled: !!recipientId,
  })
}

export function useTransferHistory(recipientId: string | undefined | null) {
  return useQuery({
    queryKey: ['transfer-history', recipientId],
    queryFn: () => fetchTransferHistory(recipientId!),
    enabled: !!recipientId,
  })
}

export function useRegisterRecipient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: RegisterRecipientData) => registerRecipient(data),
    onSuccess: (_d, variables) => {
      qc.invalidateQueries({ queryKey: ['professor', variables.professor_id] })
      qc.invalidateQueries({ queryKey: ['professores'] })
    },
  })
}

export function useRequestTransfer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ recipientId, amount }: { recipientId: string; amount: number }) =>
      requestTransfer(recipientId, amount),
    onSuccess: (_d, variables) => {
      qc.invalidateQueries({ queryKey: ['recipient-balance', variables.recipientId] })
      qc.invalidateQueries({ queryKey: ['transfer-history', variables.recipientId] })
    },
  })
}
