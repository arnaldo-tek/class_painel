import { supabase } from '@/lib/supabase'

export async function fetchSetting(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', key)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data?.value ?? null
}

export async function upsertSetting(key: string, value: string) {
  const { error } = await supabase
    .from('platform_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })

  if (error) throw error
}
