import { supabase } from '@/lib/supabase'
import { deleteFile } from '@/lib/storage'
import type { Tables } from '@/types/database'

export type Modulo = Tables<'modulos'>
export type Aula = Tables<'aulas'>
export type QuestaoAula = Tables<'questoes_da_aula'>

// === Módulos ===

export async function fetchModulos(cursoId: string) {
  const { data, error } = await supabase
    .from('modulos')
    .select('*')
    .eq('curso_id', cursoId)
    .order('sort_order')

  if (error) throw error
  return data ?? []
}

export async function createModulo(modulo: { nome: string; curso_id: string; sort_order?: number }) {
  const { data, error } = await supabase
    .from('modulos')
    .insert(modulo)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateModulo(id: string, updates: Partial<Modulo>) {
  const { data, error } = await supabase
    .from('modulos')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteModulo(id: string) {
  const { error } = await supabase.from('modulos').delete().eq('id', id)
  if (error) throw error
}

export async function reorderModulos(modulos: { id: string; sort_order: number }[]) {
  for (const m of modulos) {
    await supabase.from('modulos').update({ sort_order: m.sort_order }).eq('id', m.id)
  }
}

// === Aulas ===

export async function fetchAulas(cursoId: string, moduloId?: string) {
  let query = supabase
    .from('aulas')
    .select('*')
    .eq('curso_id', cursoId)
    .order('sort_order')

  if (moduloId) {
    query = query.eq('modulo_id', moduloId)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function fetchAula(id: string) {
  const { data, error } = await supabase
    .from('aulas')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Aula
}

export async function createAula(aula: {
  titulo: string
  curso_id: string
  modulo_id?: string | null
  descricao?: string | null
  sort_order?: number
  pdf?: string | null
  video_url?: string | null
  imagem_capa?: string | null
  is_degustacao?: boolean
  is_liberado?: boolean
}) {
  const { data, error } = await supabase
    .from('aulas')
    .insert(aula)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateAula(id: string, updates: Partial<Aula>) {
  if ('video_url' in updates) {
    const { data: old } = await supabase.from('aulas').select('video_url').eq('id', id).single()
    if (old?.video_url && old.video_url !== updates.video_url) {
      await deleteFile('aulas', old.video_url).catch(() => {})
    }
  }

  const { data, error } = await supabase
    .from('aulas')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteAula(id: string) {
  const { data: aula } = await supabase.from('aulas').select('video_url, pdf, imagem_capa, imagem_perfil').eq('id', id).single()
  const { data: audios } = await supabase.from('audios_da_aula').select('audio_url').eq('aula_id', id)

  const urls: string[] = [
    aula?.video_url,
    aula?.pdf,
    aula?.imagem_capa,
    aula?.imagem_perfil,
    ...(audios ?? []).map((a) => a.audio_url),
  ].filter(Boolean) as string[]

  await Promise.allSettled(urls.map((url) => deleteFile('aulas', url)))

  const { error } = await supabase.from('aulas').delete().eq('id', id)
  if (error) throw error
}

// === Questões ===

export async function fetchQuestoesAula(aulaId: string) {
  const { data, error } = await supabase
    .from('questoes_da_aula')
    .select('*')
    .eq('aula_id', aulaId)
    .order('sort_order')

  if (error) throw error
  return data ?? []
}

export async function createQuestaoAula(questao: {
  aula_id: string
  pergunta: string
  resposta: string
  alternativas: string[]
  video?: string | null
  sort_order?: number
}) {
  const { data, error } = await supabase
    .from('questoes_da_aula')
    .insert(questao)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateQuestaoAula(id: string, updates: Partial<QuestaoAula>) {
  const { data, error } = await supabase
    .from('questoes_da_aula')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteQuestaoAula(id: string) {
  const { error } = await supabase.from('questoes_da_aula').delete().eq('id', id)
  if (error) throw error
}

// === Áudios ===

export type AudioAula = Tables<'audios_da_aula'>

export async function fetchAudiosAula(aulaId: string) {
  const { data, error } = await supabase
    .from('audios_da_aula')
    .select('*')
    .eq('aula_id', aulaId)
    .order('created_at')

  if (error) throw error
  return data ?? []
}

export async function createAudioAula(audio: {
  aula_id: string
  titulo?: string | null
  audio_url: string
}) {
  const { data, error } = await supabase
    .from('audios_da_aula')
    .insert(audio)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteAudioAula(id: string) {
  const { data: audio } = await supabase.from('audios_da_aula').select('audio_url').eq('id', id).single()
  if (audio?.audio_url) await deleteFile('aulas', audio.audio_url).catch(() => {})

  const { error } = await supabase.from('audios_da_aula').delete().eq('id', id)
  if (error) throw error
}

// === Textos ===

export type TextoAula = Tables<'textos_da_aula'>

export async function fetchTextosAula(aulaId: string) {
  const { data, error } = await supabase
    .from('textos_da_aula')
    .select('*')
    .eq('aula_id', aulaId)
    .order('created_at')

  if (error) throw error
  return data ?? []
}

export async function createTextoAula(texto: { aula_id: string; texto: string }) {
  const { data, error } = await supabase
    .from('textos_da_aula')
    .insert(texto)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTextoAula(id: string, updates: Partial<TextoAula>) {
  const { data, error } = await supabase
    .from('textos_da_aula')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTextoAula(id: string) {
  const { error } = await supabase.from('textos_da_aula').delete().eq('id', id)
  if (error) throw error
}

// === Flashcards (professor) ===

export type FlashcardAula = Tables<'flashcards'>

export async function fetchFlashcardsAula(aulaId: string) {
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('aula_id', aulaId)
    .is('aluno_id', null)
    .order('created_at')

  if (error) throw error
  return data ?? []
}

export async function createFlashcardAula(flashcard: {
  aula_id: string
  professor_id: string
  curso_id?: string | null
  pergunta: string
  resposta: string
}) {
  const { data, error } = await supabase
    .from('flashcards')
    .insert(flashcard)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateFlashcardAula(id: string, updates: { pergunta?: string; resposta?: string }) {
  const { data, error } = await supabase
    .from('flashcards')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteFlashcardAula(id: string) {
  const { error } = await supabase.from('flashcards').delete().eq('id', id)
  if (error) throw error
}
