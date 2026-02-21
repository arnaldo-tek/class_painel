import { useRef, useState } from 'react'
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react'

interface FileUploadProps {
  label: string
  accept: string
  value: string | null
  onChange: (url: string | null) => void
  onUpload: (file: File) => Promise<string>
  type?: 'image' | 'pdf'
}

export function FileUpload({ label, accept, value, onChange, onUpload, type = 'image' }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(file: File) {
    setError('')
    setUploading(true)
    try {
      const url = await onUpload(file)
      onChange(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar arquivo')
    } finally {
      setUploading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  if (value) {
    return (
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="relative rounded-lg border border-gray-200 bg-gray-50 p-2">
          {type === 'image' ? (
            <img src={value} alt="" className="h-32 w-full rounded object-cover" />
          ) : (
            <div className="flex items-center gap-2 py-2 px-3">
              <FileText className="h-5 w-5 text-red-500" />
              <span className="truncate text-sm text-gray-700">PDF anexado</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 rounded-full bg-white p-1 shadow hover:bg-gray-100"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-6 text-sm text-gray-500 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : type === 'image' ? (
          <ImageIcon className="h-8 w-8" />
        ) : (
          <Upload className="h-8 w-8" />
        )}
        <span>{uploading ? 'Enviando...' : `Clique para adicionar ${type === 'image' ? 'imagem' : 'PDF'}`}</span>
      </button>
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
