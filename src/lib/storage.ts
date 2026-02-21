import { supabase } from './supabase'

/**
 * Upload a file to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadFile(
  bucket: string,
  file: File,
  folder?: string,
): Promise<string> {
  const ext = file.name.split('.').pop() ?? ''
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const path = folder ? `${folder}/${fileName}` : fileName

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) throw error

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Delete a file from Supabase Storage by its public URL.
 */
export async function deleteFile(bucket: string, publicUrl: string) {
  const base = supabase.storage.from(bucket).getPublicUrl('').data.publicUrl
  const path = publicUrl.replace(base, '')
  if (!path) return
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw error
}
