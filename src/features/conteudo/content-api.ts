import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'

// === Audio Cursos (Leis) ===
export type PacoteLei = Tables<'pacotes_leis'>
export type SubpastaLei = Tables<'subpastas_leis'>
export type Lei = Tables<'leis'>
export type AudioLei = Tables<'audio_leis'>
export type QuestaoLei = Tables<'questoes_leis'>

// --- Pacotes (pastas de nível 1 com tipo) ---

export async function fetchPacotesLeis(tipo: number) {
  const { data, error } = await supabase
    .from('pacotes_leis')
    .select('*')
    .eq('tipo_pacote_lei', tipo)
    .order('nome')
  if (error) throw error
  return data ?? []
}

export async function createPacoteLei(nome: string, tipo: number) {
  const { data, error } = await supabase
    .from('pacotes_leis')
    .insert({ nome, tipo_pacote_lei: tipo })
    .select().single()
  if (error) throw error
  return data
}

export async function updatePacoteLei(id: string, updates: Partial<PacoteLei>) {
  const { data, error } = await supabase
    .from('pacotes_leis').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deletePacoteLei(id: string) {
  const { error } = await supabase.from('pacotes_leis').delete().eq('id', id)
  if (error) throw error
}

// --- Subpastas (nível 2, vinculadas a um pacote_lei) ---

export async function fetchSubpastasLeis(pacoteLeiId: string) {
  const { data, error } = await supabase
    .from('subpastas_leis')
    .select('*')
    .eq('pacote_lei_id', pacoteLeiId)
    .order('nome')
  if (error) throw error
  return data ?? []
}

export async function createSubpastaLei(nome: string, pacoteLeiId: string) {
  const { data, error } = await supabase
    .from('subpastas_leis')
    .insert({ nome, pacote_lei_id: pacoteLeiId })
    .select().single()
  if (error) throw error
  return data
}

export async function updateSubpastaLei(id: string, updates: Partial<SubpastaLei>) {
  const { data, error } = await supabase
    .from('subpastas_leis').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteSubpastaLei(id: string) {
  const { error } = await supabase.from('subpastas_leis').delete().eq('id', id)
  if (error) throw error
}

// --- Leis (nível 3, vinculadas a uma subpasta) ---

export async function fetchLeis(subpastaId: string) {
  const { data, error } = await supabase
    .from('leis')
    .select('*')
    .eq('subpasta_id', subpastaId)
    .is('deleted_at', null)
    .order('nome')
  if (error) throw error
  return data ?? []
}

export async function createLei(lei: { nome: string; texto?: string | null; subpasta_id: string }) {
  const { data, error } = await supabase.from('leis').insert(lei).select().single()
  if (error) throw error
  return data
}

export async function updateLei(id: string, updates: Partial<Lei>) {
  const { data, error } = await supabase.from('leis').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteLei(id: string) {
  const { error } = await supabase.from('leis').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function fetchLei(id: string) {
  const { data, error } = await supabase.from('leis').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

// --- Áudios da Lei ---

export async function fetchAudioLeis(leiId: string) {
  const { data, error } = await supabase
    .from('audio_leis')
    .select('*')
    .eq('lei_id', leiId)
    .order('created_at')
  if (error) throw error
  return data ?? []
}

export async function createAudioLei(audio: { lei_id: string; titulo?: string | null; audio_url: string }) {
  const { data, error } = await supabase.from('audio_leis').insert(audio).select().single()
  if (error) throw error
  return data
}

export async function updateAudioLei(id: string, updates: Partial<AudioLei>) {
  const { data, error } = await supabase.from('audio_leis').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteAudioLei(id: string) {
  const { error } = await supabase.from('audio_leis').delete().eq('id', id)
  if (error) throw error
}

// --- Questões da Lei ---

export async function fetchQuestoesLeis(leiId: string) {
  const { data, error } = await supabase
    .from('questoes_leis')
    .select('*')
    .eq('lei_id', leiId)
  if (error) throw error
  return data ?? []
}

export async function createQuestaoLei(q: { lei_id: string; pergunta: string; resposta: string; alternativas?: string[] | null; video?: string | null }) {
  const { data, error } = await supabase.from('questoes_leis').insert(q).select().single()
  if (error) throw error
  return data
}

export async function updateQuestaoLei(id: string, updates: Partial<QuestaoLei>) {
  const { data, error } = await supabase.from('questoes_leis').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteQuestaoLei(id: string) {
  const { error } = await supabase.from('questoes_leis').delete().eq('id', id)
  if (error) throw error
}

// === Documentos ===
export type Documento = Tables<'documentos'>

export async function fetchDocumentos() {
  const { data, error } = await supabase.from('documentos').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createDocumento(doc: { nome: string; pdf?: string | null }) {
  const { data, error } = await supabase.from('documentos').insert(doc).select().single()
  if (error) throw error
  return data
}

export async function deleteDocumento(id: string) {
  const { error } = await supabase.from('documentos').delete().eq('id', id)
  if (error) throw error
}

// === Banners ===
export type Banner = Tables<'banners'>

export async function fetchBanners() {
  const { data, error } = await supabase.from('banners').select('*').order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function createBanner(b: { imagem: string; redirecionamento?: string | null; is_active?: boolean; sort_order?: number }) {
  const { data, error } = await supabase.from('banners').insert(b).select().single()
  if (error) throw error
  return data
}

export async function updateBanner(id: string, updates: Partial<Banner>) {
  const { data, error } = await supabase.from('banners').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteBanner(id: string) {
  const { error } = await supabase.from('banners').delete().eq('id', id)
  if (error) throw error
}

// === Publicidade Abertura ===
export type PublicidadeAbertura = Tables<'publicidade_abertura'>

export async function fetchPublicidadeAbertura() {
  const { data, error } = await supabase.from('publicidade_abertura').select('*').order('plataforma' as never)
  if (error) throw error
  return data ?? []
}

export async function createPublicidadeAbertura(b: { imagem: string; link?: string | null; is_active?: boolean; plataforma?: string }) {
  const { data, error } = await supabase.from('publicidade_abertura').insert(b as never).select().single()
  if (error) throw error
  return data
}

export async function updatePublicidadeAbertura(id: string, updates: Partial<PublicidadeAbertura> & { plataforma?: string; imagem?: string }) {
  const { data, error } = await supabase.from('publicidade_abertura').update(updates as never).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deletePublicidadeAbertura(id: string) {
  const { error } = await supabase.from('publicidade_abertura').delete().eq('id', id)
  if (error) throw error
}

// === Publicidade Area Aluno ===
export type PublicidadeAreaAluno = Tables<'publicidade_area_aluno'>

export async function fetchPublicidadeAreaAluno() {
  const { data, error } = await supabase.from('publicidade_area_aluno').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createPublicidadeAreaAluno(b: { imagem: string; link?: string | null; is_active?: boolean }) {
  const { data, error } = await supabase.from('publicidade_area_aluno').insert(b).select().single()
  if (error) throw error
  return data
}

export async function updatePublicidadeAreaAluno(id: string, updates: Partial<PublicidadeAreaAluno>) {
  const { data, error } = await supabase.from('publicidade_area_aluno').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deletePublicidadeAreaAluno(id: string) {
  const { error } = await supabase.from('publicidade_area_aluno').delete().eq('id', id)
  if (error) throw error
}

// === Publicidade Audio Curso ===
export type PublicidadeAudioCurso = Tables<'publicidade_audio_curso'>

export async function fetchPublicidadeAudioCurso() {
  const { data, error } = await supabase.from('publicidade_audio_curso').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createPublicidadeAudioCurso(b: { imagem: string; link?: string | null; is_active?: boolean }) {
  const { data, error } = await supabase.from('publicidade_audio_curso').insert(b).select().single()
  if (error) throw error
  return data
}

export async function updatePublicidadeAudioCurso(id: string, updates: Partial<PublicidadeAudioCurso>) {
  const { data, error } = await supabase.from('publicidade_audio_curso').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deletePublicidadeAudioCurso(id: string) {
  const { error } = await supabase.from('publicidade_audio_curso').delete().eq('id', id)
  if (error) throw error
}

// === Tutoriais ===
export type Tutorial = Tables<'tutoriais'>

export async function fetchTutoriais() {
  const { data, error } = await supabase.from('tutoriais').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createTutorial(t: { titulo?: string | null; descricao?: string | null; video?: string | null; pdf?: string | null; tipo_tutorial?: string | null }) {
  const { data, error } = await supabase.from('tutoriais').insert(t).select().single()
  if (error) throw error
  return data
}

export async function updateTutorial(id: string, updates: Partial<Tutorial>) {
  const { data, error } = await supabase.from('tutoriais').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteTutorial(id: string) {
  const { error } = await supabase.from('tutoriais').delete().eq('id', id)
  if (error) throw error
}
