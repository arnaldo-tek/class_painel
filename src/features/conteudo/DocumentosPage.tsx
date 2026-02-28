import { useState, type FormEvent } from 'react'
import { FolderOpen, Plus, Trash2, X, FileText } from 'lucide-react'
import { useDocumentos, useCreateDocumento, useDeleteDocumento } from './content-hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileUpload } from '@/components/ui/file-upload'
import { EmptyState } from '@/components/ui/empty-state'
import { uploadFile } from '@/lib/storage'

export function DocumentosPage() {
  const { data: docs, isLoading } = useDocumentos()
  const [showForm, setShowForm] = useState(false)
  const [nome, setNome] = useState('')
  const [pdf, setPdf] = useState<string | null>(null)
  const [error, setError] = useState('')
  const createMutation = useCreateDocumento()
  const deleteMutation = useDeleteDocumento()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) { setError('Nome é obrigatório'); return }
    if (!pdf) { setError('PDF é obrigatório'); return }
    try {
      await createMutation.mutateAsync({ nome: nome.trim(), pdf })
      setNome(''); setPdf(null); setShowForm(false); setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
        <Button onClick={() => setShowForm(true)}><Plus className="mr-2 h-4 w-4" />Novo Documento</Button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
          <div className="flex items-center justify-between"><h3 className="font-medium">Novo Documento</h3><button onClick={() => { setShowForm(false); setError('') }} className="text-gray-400"><X className="h-4 w-4" /></button></div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input placeholder="Nome do documento" value={nome} onChange={(e) => setNome(e.target.value)} required />
            <FileUpload
              label="Arquivo PDF"
              accept="application/pdf"
              type="pdf"
              value={pdf}
              onChange={(url) => setPdf(url)}
              onUpload={(file) => uploadFile('documentos', file)}
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={createMutation.isPending}>Criar</Button>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>
      ) : !docs?.length ? (
        <EmptyState icon={<FolderOpen className="h-12 w-12" />} title="Nenhum documento" />
      ) : (
        <div className="space-y-2">
          {docs.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{d.nome}</p>
                  {d.pdf && <a href={d.pdf} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">Ver PDF</a>}
                </div>
              </div>
              <button onClick={() => { if (confirm(`Excluir "${d.nome}"?`)) deleteMutation.mutate(d.id) }} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
