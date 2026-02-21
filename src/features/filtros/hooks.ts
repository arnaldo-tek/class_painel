import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchEstados, fetchMunicipios, fetchMunicipiosByEstado,
  fetchEsferas, createEsfera, updateEsfera, deleteEsfera,
  fetchEscolaridades, createEscolaridade, updateEscolaridade, deleteEscolaridade,
  fetchNiveis, createNivel, updateNivel, deleteNivel,
  fetchOrgaos, createOrgao, updateOrgao, deleteOrgao,
  fetchCargos, createCargo, updateCargo, deleteCargo,
  fetchDisciplinas, createDisciplina, updateDisciplina, deleteDisciplina,
} from './api'

// --- Somente leitura ---

export function useEstados() {
  return useQuery({ queryKey: ['estados'], queryFn: fetchEstados })
}

export function useMunicipios(estadoId?: string, page = 1) {
  return useQuery({
    queryKey: ['municipios', estadoId, page],
    queryFn: () => fetchMunicipios(estadoId, page),
  })
}

export function useMunicipiosByEstado(estadoId?: string) {
  return useQuery({
    queryKey: ['municipios-by-estado', estadoId],
    queryFn: () => fetchMunicipiosByEstado(estadoId!),
    enabled: !!estadoId,
  })
}

// --- Esferas ---

export function useEsferas() {
  return useQuery({ queryKey: ['esferas'], queryFn: fetchEsferas })
}

export function useCreateEsfera() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: createEsfera, onSuccess: () => qc.invalidateQueries({ queryKey: ['esferas'] }) })
}

export function useUpdateEsfera() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Record<string, unknown>) => updateEsfera(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['esferas'] }),
  })
}

export function useDeleteEsfera() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: deleteEsfera, onSuccess: () => qc.invalidateQueries({ queryKey: ['esferas'] }) })
}

// --- Escolaridades ---

export function useEscolaridades() {
  return useQuery({ queryKey: ['escolaridades'], queryFn: fetchEscolaridades })
}

export function useCreateEscolaridade() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: createEscolaridade, onSuccess: () => qc.invalidateQueries({ queryKey: ['escolaridades'] }) })
}

export function useUpdateEscolaridade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Record<string, unknown>) => updateEscolaridade(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['escolaridades'] }),
  })
}

export function useDeleteEscolaridade() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: deleteEscolaridade, onSuccess: () => qc.invalidateQueries({ queryKey: ['escolaridades'] }) })
}

// --- Níveis ---

export function useNiveis() {
  return useQuery({ queryKey: ['niveis'], queryFn: fetchNiveis })
}

export function useCreateNivel() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: createNivel, onSuccess: () => qc.invalidateQueries({ queryKey: ['niveis'] }) })
}

export function useUpdateNivel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Record<string, unknown>) => updateNivel(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['niveis'] }),
  })
}

export function useDeleteNivel() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: deleteNivel, onSuccess: () => qc.invalidateQueries({ queryKey: ['niveis'] }) })
}

// --- Órgãos ---

export function useOrgaos() {
  return useQuery({ queryKey: ['orgaos'], queryFn: fetchOrgaos })
}

export function useCreateOrgao() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: createOrgao, onSuccess: () => qc.invalidateQueries({ queryKey: ['orgaos'] }) })
}

export function useUpdateOrgao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Record<string, unknown>) => updateOrgao(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orgaos'] }),
  })
}

export function useDeleteOrgao() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: deleteOrgao, onSuccess: () => qc.invalidateQueries({ queryKey: ['orgaos'] }) })
}

// --- Cargos ---

export function useCargos() {
  return useQuery({ queryKey: ['cargos'], queryFn: fetchCargos })
}

export function useCreateCargo() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: createCargo, onSuccess: () => qc.invalidateQueries({ queryKey: ['cargos'] }) })
}

export function useUpdateCargo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Record<string, unknown>) => updateCargo(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cargos'] }),
  })
}

export function useDeleteCargo() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: deleteCargo, onSuccess: () => qc.invalidateQueries({ queryKey: ['cargos'] }) })
}

// --- Disciplinas ---

export function useDisciplinas() {
  return useQuery({ queryKey: ['disciplinas'], queryFn: fetchDisciplinas })
}

export function useCreateDisciplina() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: createDisciplina, onSuccess: () => qc.invalidateQueries({ queryKey: ['disciplinas'] }) })
}

export function useUpdateDisciplina() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Record<string, unknown>) => updateDisciplina(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['disciplinas'] }),
  })
}

export function useDeleteDisciplina() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: deleteDisciplina, onSuccess: () => qc.invalidateQueries({ queryKey: ['disciplinas'] }) })
}
