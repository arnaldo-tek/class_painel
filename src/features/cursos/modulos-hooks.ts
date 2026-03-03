import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchModulos, createModulo, updateModulo, deleteModulo, reorderModulos,
  fetchAulas, fetchAula, createAula, updateAula, deleteAula,
  fetchQuestoesAula, createQuestaoAula, updateQuestaoAula, deleteQuestaoAula,
  fetchAudiosAula, createAudioAula, deleteAudioAula,
  fetchTextosAula, createTextoAula, updateTextoAula, deleteTextoAula,
  fetchFlashcardsAula, createFlashcardAula, updateFlashcardAula, deleteFlashcardAula,
} from './modulos-api'

// === Módulos ===

export function useModulos(cursoId: string | undefined) {
  return useQuery({
    queryKey: ['modulos', cursoId],
    queryFn: () => fetchModulos(cursoId!),
    enabled: !!cursoId,
  })
}

export function useCreateModulo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createModulo,
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['modulos', v.curso_id] }),
  })
}

export function useUpdateModulo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string; curso_id?: string } & Record<string, unknown>) =>
      updateModulo(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['modulos'] }),
  })
}

export function useDeleteModulo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteModulo,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['modulos'] }),
  })
}

export function useReorderModulos() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: reorderModulos,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['modulos'] }),
  })
}

// === Aulas ===

export function useAulas(cursoId: string | undefined, moduloId?: string) {
  return useQuery({
    queryKey: ['aulas', cursoId, moduloId],
    queryFn: () => fetchAulas(cursoId!, moduloId),
    enabled: !!cursoId,
  })
}

export function useAula(id: string | undefined) {
  return useQuery({
    queryKey: ['aula', id],
    queryFn: () => fetchAula(id!),
    enabled: !!id,
  })
}

export function useCreateAula() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createAula,
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['aulas', v.curso_id] })
    },
  })
}

export function useUpdateAula() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Record<string, unknown>) =>
      updateAula(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['aulas'] }),
  })
}

export function useDeleteAula() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteAula,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['aulas'] }),
  })
}

// === Questões ===

export function useQuestoesAula(aulaId: string | undefined) {
  return useQuery({
    queryKey: ['questoes-aula', aulaId],
    queryFn: () => fetchQuestoesAula(aulaId!),
    enabled: !!aulaId,
  })
}

export function useCreateQuestaoAula() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createQuestaoAula,
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['questoes-aula', v.aula_id] }),
  })
}

export function useUpdateQuestaoAula() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Record<string, unknown>) =>
      updateQuestaoAula(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['questoes-aula'] }),
  })
}

export function useDeleteQuestaoAula() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteQuestaoAula,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['questoes-aula'] }),
  })
}

// === Áudios ===

export function useAudiosAula(aulaId: string | undefined) {
  return useQuery({
    queryKey: ['audios-aula', aulaId],
    queryFn: () => fetchAudiosAula(aulaId!),
    enabled: !!aulaId,
  })
}

export function useCreateAudioAula() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createAudioAula,
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['audios-aula', v.aula_id] }),
  })
}

export function useDeleteAudioAula() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteAudioAula,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audios-aula'] }),
  })
}

// === Textos ===

export function useTextosAula(aulaId: string | undefined) {
  return useQuery({
    queryKey: ['textos-aula', aulaId],
    queryFn: () => fetchTextosAula(aulaId!),
    enabled: !!aulaId,
  })
}

export function useCreateTextoAula() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createTextoAula,
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['textos-aula', v.aula_id] }),
  })
}

export function useUpdateTextoAula() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Record<string, unknown>) =>
      updateTextoAula(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['textos-aula'] }),
  })
}

export function useDeleteTextoAula() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteTextoAula,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['textos-aula'] }),
  })
}

// === Flashcards ===

export function useFlashcardsAula(aulaId: string | undefined) {
  return useQuery({
    queryKey: ['flashcards-aula', aulaId],
    queryFn: () => fetchFlashcardsAula(aulaId!),
    enabled: !!aulaId,
  })
}

export function useCreateFlashcardAula() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createFlashcardAula,
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['flashcards-aula', v.aula_id] }),
  })
}

export function useUpdateFlashcardAula() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string; pergunta?: string; resposta?: string }) =>
      updateFlashcardAula(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['flashcards-aula'] }),
  })
}

export function useDeleteFlashcardAula() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteFlashcardAula,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['flashcards-aula'] }),
  })
}
