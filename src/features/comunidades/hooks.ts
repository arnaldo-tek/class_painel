import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchComunidades, fetchComunidade, createComunidade, updateComunidade, deleteComunidade,
  fetchMembros, suspenderMembro, removeMembro,
  fetchMensagens, deleteMensagem,
} from './api'

// Comunidades
export function useComunidades() {
  return useQuery({ queryKey: ['comunidades'], queryFn: fetchComunidades })
}

export function useComunidade(id: string | undefined) {
  return useQuery({ queryKey: ['comunidade', id], queryFn: () => fetchComunidade(id!), enabled: !!id })
}

export function useCreateComunidade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createComunidade,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comunidades'] }),
  })
}

export function useUpdateComunidade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...u }: { id: string } & Record<string, unknown>) => updateComunidade(id, u),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['comunidades'] })
      qc.invalidateQueries({ queryKey: ['comunidade', v.id] })
    },
  })
}

export function useDeleteComunidade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteComunidade,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comunidades'] }),
  })
}

// Membros
export function useMembros(comunidadeId: string | undefined) {
  return useQuery({
    queryKey: ['comunidade-membros', comunidadeId],
    queryFn: () => fetchMembros(comunidadeId!),
    enabled: !!comunidadeId,
  })
}

export function useSuspenderMembro() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, suspenso }: { id: string; suspenso: boolean }) => suspenderMembro(id, suspenso),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comunidade-membros'] }),
  })
}

export function useRemoveMembro() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: removeMembro,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comunidade-membros'] }),
  })
}

// Mensagens
export function useMensagens(comunidadeId: string | undefined) {
  return useQuery({
    queryKey: ['comunidade-mensagens', comunidadeId],
    queryFn: () => fetchMensagens(comunidadeId!),
    enabled: !!comunidadeId,
  })
}

export function useDeleteMensagem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteMensagem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comunidade-mensagens'] }),
  })
}
