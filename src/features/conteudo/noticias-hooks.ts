import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchNoticias, createNoticia, updateNoticia, deleteNoticia,
  fetchEditais, createEdital, updateEdital, deleteEdital,
} from './noticias-api'

export function useNoticias() {
  return useQuery({ queryKey: ['noticias'], queryFn: fetchNoticias })
}

export function useCreateNoticia() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: createNoticia, onSuccess: () => qc.invalidateQueries({ queryKey: ['noticias'] }) })
}

export function useUpdateNoticia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...u }: { id: string } & Record<string, unknown>) => updateNoticia(id, u),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['noticias'] }),
  })
}

export function useDeleteNoticia() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: deleteNoticia, onSuccess: () => qc.invalidateQueries({ queryKey: ['noticias'] }) })
}

export function useEditais() {
  return useQuery({ queryKey: ['editais'], queryFn: fetchEditais })
}

export function useCreateEdital() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: createEdital, onSuccess: () => qc.invalidateQueries({ queryKey: ['editais'] }) })
}

export function useUpdateEdital() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...u }: { id: string } & Record<string, unknown>) => updateEdital(id, u),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['editais'] }),
  })
}

export function useDeleteEdital() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: deleteEdital, onSuccess: () => qc.invalidateQueries({ queryKey: ['editais'] }) })
}
