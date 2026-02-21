import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchPacotesLeis, createPacoteLei, updatePacoteLei, deletePacoteLei,
  fetchSubpastasLeis, createSubpastaLei, updateSubpastaLei, deleteSubpastaLei,
  fetchLeis, fetchLei, createLei, updateLei, deleteLei,
  fetchAudioLeis, createAudioLei, updateAudioLei, deleteAudioLei,
  fetchQuestoesLeis, createQuestaoLei, updateQuestaoLei, deleteQuestaoLei,
  fetchDocumentos, createDocumento, deleteDocumento,
  fetchBanners, createBanner, updateBanner, deleteBanner,
  fetchTutoriais, createTutorial, updateTutorial, deleteTutorial,
} from './content-api'

// Pacotes Leis (nível 1 - abas)
export function usePacotesLeis(tipo: number) {
  return useQuery({ queryKey: ['pacotes-leis', tipo], queryFn: () => fetchPacotesLeis(tipo) })
}
export function useCreatePacoteLei() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ nome, tipo }: { nome: string; tipo: number }) => createPacoteLei(nome, tipo),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pacotes-leis'] }),
  })
}
export function useUpdatePacoteLei() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...u }: { id: string } & Record<string, unknown>) => updatePacoteLei(id, u),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pacotes-leis'] }),
  })
}
export function useDeletePacoteLei() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: deletePacoteLei, onSuccess: () => qc.invalidateQueries({ queryKey: ['pacotes-leis'] }) })
}

// Subpastas (nível 2)
export function useSubpastasLeis(pacoteLeiId: string | undefined) {
  return useQuery({
    queryKey: ['subpastas-leis', pacoteLeiId],
    queryFn: () => fetchSubpastasLeis(pacoteLeiId!),
    enabled: !!pacoteLeiId,
  })
}
export function useCreateSubpastaLei() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ nome, pacoteLeiId }: { nome: string; pacoteLeiId: string }) => createSubpastaLei(nome, pacoteLeiId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subpastas-leis'] }),
  })
}
export function useUpdateSubpastaLei() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...u }: { id: string } & Record<string, unknown>) => updateSubpastaLei(id, u),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subpastas-leis'] }),
  })
}
export function useDeleteSubpastaLei() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: deleteSubpastaLei, onSuccess: () => qc.invalidateQueries({ queryKey: ['subpastas-leis'] }) })
}

// Leis (nível 3)
export function useLeis(subpastaId: string | undefined) {
  return useQuery({ queryKey: ['leis', subpastaId], queryFn: () => fetchLeis(subpastaId!), enabled: !!subpastaId })
}
export function useLei(id: string | undefined) {
  return useQuery({ queryKey: ['lei', id], queryFn: () => fetchLei(id!), enabled: !!id })
}
export function useCreateLei() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: createLei, onSuccess: () => qc.invalidateQueries({ queryKey: ['leis'] }) })
}
export function useUpdateLei() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...u }: { id: string } & Record<string, unknown>) => updateLei(id, u),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leis'] }),
  })
}
export function useDeleteLei() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: deleteLei, onSuccess: () => qc.invalidateQueries({ queryKey: ['leis'] }) })
}

// Áudios da Lei
export function useAudioLeis(leiId: string | undefined) {
  return useQuery({ queryKey: ['audio-leis', leiId], queryFn: () => fetchAudioLeis(leiId!), enabled: !!leiId })
}
export function useCreateAudioLei() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: createAudioLei, onSuccess: () => qc.invalidateQueries({ queryKey: ['audio-leis'] }) })
}
export function useUpdateAudioLei() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...u }: { id: string } & Record<string, unknown>) => updateAudioLei(id, u),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audio-leis'] }),
  })
}
export function useDeleteAudioLei() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: deleteAudioLei, onSuccess: () => qc.invalidateQueries({ queryKey: ['audio-leis'] }) })
}

// Questões da Lei
export function useQuestoesLeis(leiId: string | undefined) {
  return useQuery({ queryKey: ['questoes-leis', leiId], queryFn: () => fetchQuestoesLeis(leiId!), enabled: !!leiId })
}
export function useCreateQuestaoLei() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: createQuestaoLei, onSuccess: () => qc.invalidateQueries({ queryKey: ['questoes-leis'] }) })
}
export function useUpdateQuestaoLei() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...u }: { id: string } & Record<string, unknown>) => updateQuestaoLei(id, u),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['questoes-leis'] }),
  })
}
export function useDeleteQuestaoLei() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: deleteQuestaoLei, onSuccess: () => qc.invalidateQueries({ queryKey: ['questoes-leis'] }) })
}

// Documentos
export function useDocumentos() {
  return useQuery({ queryKey: ['documentos'], queryFn: fetchDocumentos })
}
export function useCreateDocumento() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: createDocumento, onSuccess: () => qc.invalidateQueries({ queryKey: ['documentos'] }) })
}
export function useDeleteDocumento() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: deleteDocumento, onSuccess: () => qc.invalidateQueries({ queryKey: ['documentos'] }) })
}

// Banners
export function useBanners() {
  return useQuery({ queryKey: ['banners'], queryFn: fetchBanners })
}
export function useCreateBanner() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: createBanner, onSuccess: () => qc.invalidateQueries({ queryKey: ['banners'] }) })
}
export function useUpdateBanner() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, ...u }: { id: string } & Record<string, unknown>) => updateBanner(id, u), onSuccess: () => qc.invalidateQueries({ queryKey: ['banners'] }) })
}
export function useDeleteBanner() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: deleteBanner, onSuccess: () => qc.invalidateQueries({ queryKey: ['banners'] }) })
}

// Tutoriais
export function useTutoriais() {
  return useQuery({ queryKey: ['tutoriais'], queryFn: fetchTutoriais })
}
export function useCreateTutorial() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: createTutorial, onSuccess: () => qc.invalidateQueries({ queryKey: ['tutoriais'] }) })
}
export function useUpdateTutorial() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, ...u }: { id: string } & Record<string, unknown>) => updateTutorial(id, u), onSuccess: () => qc.invalidateQueries({ queryKey: ['tutoriais'] }) })
}
export function useDeleteTutorial() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: deleteTutorial, onSuccess: () => qc.invalidateQueries({ queryKey: ['tutoriais'] }) })
}
