import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'

export type Faq = Tables<'faq'>

export async function fetchFaqs() {
  const { data, error } = await supabase
    .from('faq')
    .select('*')
    .order('sort_order')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createFaq(faq: {
  titulo: string
  pergunta?: string | null
  resposta?: string | null
  video?: string | null
  sort_order?: number
}) {
  const { data, error } = await supabase
    .from('faq')
    .insert(faq)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateFaq(id: string, updates: Partial<Faq>) {
  const { data, error } = await supabase
    .from('faq')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteFaq(id: string) {
  const { error } = await supabase
    .from('faq')
    .delete()
    .eq('id', id)

  if (error) throw error
}
