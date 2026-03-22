import { supabase } from './supabase'

// Supabase storage upload limit (adjust after upgrading plan)
const MAX_VIDEO_SIZE_MB = 500
const MAX_OTHER_SIZE_MB = 50
const MAX_VIDEO_DURATION_SECONDS = 30 * 60 // 30 minutos

/**
 * Upload a file to Supabase Storage.
 * Returns the public URL of the uploaded file.
 * For large files (videos), uses XMLHttpRequest with progress tracking.
 */
export async function uploadFile(
  bucket: string,
  file: File,
  folder?: string,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const isVideo = file.type.startsWith('video/')
  const maxMB = isVideo ? MAX_VIDEO_SIZE_MB : MAX_OTHER_SIZE_MB
  const fileSizeMB = file.size / (1024 * 1024)

  if (fileSizeMB > maxMB) {
    throw new Error(`Arquivo muito grande (${fileSizeMB.toFixed(0)}MB). Máximo permitido: ${maxMB}MB.`)
  }

  if (isVideo) {
    const duration = await getVideoDuration(file).catch(() => NaN)
    if (!Number.isFinite(duration)) {
      throw new Error('Não foi possível verificar a duração do vídeo. Certifique-se de que é um arquivo MP4 válido e tente novamente.')
    }
    if (duration > MAX_VIDEO_DURATION_SECONDS) {
      const mins = Math.ceil(duration / 60)
      throw new Error(`O vídeo tem ${mins} minutos. O máximo permitido é 30 minutos.`)
    }
  }

  const ext = file.name.split('.').pop() ?? ''
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const path = folder ? `${folder}/${fileName}` : fileName

  if (isVideo && file.size > 10 * 1024 * 1024) {
    // Large files: use XMLHttpRequest for progress tracking and no timeout
    await uploadWithProgress(bucket, path, file, onProgress)
  } else {
    onProgress?.(0)
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })
    if (error) throw error
    onProgress?.(100)
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Upload using XMLHttpRequest for progress tracking (no fetch timeout).
 */
function uploadWithProgress(
  bucket: string,
  path: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    const session = supabase.auth as any

    // Get current session token
    session.getSession().then(({ data: sessionData }: any) => {
      const token = sessionData?.session?.access_token ?? supabaseKey

      const xhr = new XMLHttpRequest()
      const url = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`

      xhr.open('POST', url)
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.setRequestHeader('apikey', supabaseKey)
      xhr.setRequestHeader('x-upsert', 'false')
      xhr.setRequestHeader('cache-control', '3600')
      xhr.setRequestHeader('Content-Type', file.type || 'video/mp4')

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100)
          onProgress?.(percent)
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress?.(100)
          resolve()
        } else {
          try {
            const err = JSON.parse(xhr.responseText)
            reject(new Error(err.message || err.error || `Erro no upload: ${xhr.status}`))
          } catch {
            reject(new Error(`Erro no upload: ${xhr.status} ${xhr.statusText}`))
          }
        }
      }

      xhr.onerror = () => reject(new Error('Erro de rede ao enviar arquivo'))
      xhr.ontimeout = () => reject(new Error('Upload demorou demais. Tente um arquivo menor.'))

      xhr.send(file)
    }).catch(reject)
  })
}

/** Read video duration from a File using a temporary <video> element. */
export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src)
      resolve(video.duration)
    }
    video.onerror = () => reject(new Error('Não foi possível ler o vídeo'))
    video.src = URL.createObjectURL(file)
  })
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
