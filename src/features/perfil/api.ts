import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'

export type ProfessorProfile = Tables<'professor_profiles'>

export async function fetchProfessorProfileByUserId(userId: string) {
  const { data, error } = await supabase
    .from('professor_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data as ProfessorProfile | null
}

export async function updateProfessorProfile(id: string, updates: Partial<ProfessorProfile>) {
  const { data, error } = await supabase
    .from('professor_profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as ProfessorProfile
}
