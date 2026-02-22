import { useState, type FormEvent } from 'react'
import { HelpCircle, Plus, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { useFaqs, useCreateFaq, useUpdateFaq, useDeleteFaq } from './hooks'
import type { Faq } from './api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { FileUpload } from '@/components/ui/file-upload'
import { Modal } from '@/components/ui/modal'
import { uploadFile } from '@/lib/storage'

export function FaqPage() {
  const { data: faqs, isLoading } = useFaqs()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Faq | null>(null)

  function handleEdit(faq: Faq) {
    setEditing(faq)
    setShowForm(true)
  }

  function handleCloseForm() {
    setShowForm(false)
    setEditing(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">FAQ</h1>
        <Button onClick={() => { setEditing(null); setShowForm(true) }}>
          <Plus className="mr-2 h-4 w-4" />Novo FAQ
        </Button>
      </div>

      <Modal open={showForm} onClose={handleCloseForm} title={editing ? 'Editar FAQ' : 'Novo FAQ'} maxWidth="max-w-xl">
        <FaqForm faq={editing} onClose={handleCloseForm} />
      </Modal>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : !faqs?.length ? (
        <EmptyState icon={<HelpCircle className="h-12 w-12" />} title="Nenhum FAQ cadastrado" />
      ) : (
        <div className="space-y-3">
          {faqs.map((faq) => (
            <FaqCard key={faq.id} faq={faq} onEdit={handleEdit} />
          ))}
        </div>
      )}
    </div>
  )
}

function FaqForm({ faq, onClose }: { faq: Faq | null; onClose: () => void }) {
  const [titulo, setTitulo] = useState(faq?.titulo ?? '')
  const [pergunta, setPergunta] = useState(faq?.pergunta ?? '')
  const [resposta, setResposta] = useState(faq?.resposta ?? '')
  const [video, setVideo] = useState(faq?.video ?? '')
  const [error, setError] = useState('')
  const createMutation = useCreateFaq()
  const updateMutation = useUpdateFaq()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) { setError('Titulo e obrigatorio'); return }
    setError('')

    try {
      if (faq) {
        await updateMutation.mutateAsync({
          id: faq.id,
          titulo: titulo.trim(),
          pergunta: pergunta.trim() || null,
          resposta: resposta.trim() || null,
          video: video.trim() || null,
        })
      } else {
        await createMutation.mutateAsync({
          titulo: titulo.trim(),
          pergunta: pergunta.trim() || null,
          resposta: resposta.trim() || null,
          video: video.trim() || null,
        })
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-sm font-medium text-gray-700">Titulo *</label>
        <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Titulo do FAQ" required />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700">Pergunta</label>
        <textarea
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          placeholder="Pergunta frequente..."
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows={2}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700">Resposta</label>
        <textarea
          value={resposta}
          onChange={(e) => setResposta(e.target.value)}
          placeholder="Resposta..."
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows={3}
        />
      </div>
      <FileUpload
        label="Video"
        accept="video/*"
        type="video"
        value={video || null}
        onChange={(url) => setVideo(url ?? '')}
        onUpload={(file) => uploadFile('faq', file, 'videos')}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando...' : faq ? 'Salvar' : 'Criar'}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
      </div>
    </form>
  )
}

function FaqCard({ faq, onEdit }: { faq: Faq; onEdit: (faq: Faq) => void }) {
  const [expanded, setExpanded] = useState(false)
  const deleteMutation = useDeleteFaq()

  function handleDelete() {
    if (confirm('Excluir este FAQ?')) {
      deleteMutation.mutate(faq.id)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <HelpCircle className="h-5 w-5 text-blue-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900">{faq.titulo}</p>
          {faq.pergunta && <p className="text-sm text-gray-500 truncate">{faq.pergunta}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(faq) }}
            className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete() }}
            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
            title="Excluir"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          {expanded
            ? <ChevronDown className="h-5 w-5 text-gray-400" />
            : <ChevronRight className="h-5 w-5 text-gray-400" />
          }
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
          {faq.resposta && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Resposta</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{faq.resposta}</p>
            </div>
          )}
          {faq.video && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Video</p>
              <video src={faq.video} controls className="w-full max-w-lg rounded-lg" preload="metadata" />
            </div>
          )}
          {!faq.resposta && !faq.video && (
            <p className="text-sm text-gray-400">Nenhum conteudo adicional.</p>
          )}
        </div>
      )}
    </div>
  )
}
