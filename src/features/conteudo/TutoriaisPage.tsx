import { useState, type FormEvent } from 'react'
import {
  PlayCircle, FileText, Plus, Pencil, Trash2, Search, Video, BookOpen, ExternalLink,
} from 'lucide-react'
import { useTutoriais, useCreateTutorial, useUpdateTutorial, useDeleteTutorial } from './content-hooks'
import { uploadFile } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { FileUpload } from '@/components/ui/file-upload'
import { EmptyState } from '@/components/ui/empty-state'
import type { Tutorial } from './content-api'

type TipoTutorial = 'Video' | 'PDF'
type Destinatario = 'professor' | 'aluno' | 'todos'

const DESTINATARIO_OPTIONS = [
  { value: 'professor', label: 'Professores' },
  { value: 'aluno', label: 'Alunos' },
  { value: 'todos', label: 'Todos' },
]

export function TutoriaisPage() {
  const { data: tutoriais, isLoading } = useTutoriais()
  const [tab, setTab] = useState<TipoTutorial>('Video')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const deleteMutation = useDeleteTutorial()

  const editing = tutoriais?.find((t) => t.id === editingId)

  const filtered = (tutoriais ?? []).filter((t) => {
    const tipo = t.tipo_tutorial ?? 'Video'
    if (tipo !== tab) return false
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      if (
        !t.titulo?.toLowerCase().includes(term) &&
        !t.descricao?.toLowerCase().includes(term)
      ) return false
    }
    return true
  })

  function openNew() { setEditingId(null); setModalOpen(true) }
  function openEdit(id: string) { setEditingId(id); setModalOpen(true) }
  function closeModal() { setModalOpen(false); setEditingId(null) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tutoriais</h1>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Novo Tutorial
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-200">
        {([
          { key: 'Video' as const, label: 'Tutoriais em Vídeo', icon: Video },
          { key: 'PDF' as const, label: 'Manuais (PDF)', icon: BookOpen },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSearchTerm('') }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder={`Buscar ${tab === 'Video' ? 'vídeos' : 'manuais'}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Editar Tutorial' : 'Novo Tutorial'} maxWidth="max-w-lg">
        <TutorialForm editing={editing} defaultTipo={tab} onClose={closeModal} />
      </Modal>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : !filtered.length ? (
        <EmptyState
          icon={tab === 'Video' ? <PlayCircle className="h-12 w-12" /> : <FileText className="h-12 w-12" />}
          title={searchTerm ? 'Nenhum resultado' : `Nenhum ${tab === 'Video' ? 'tutorial em vídeo' : 'manual'}`}
          description={searchTerm ? 'Tente buscar com outros termos.' : `Adicione o primeiro ${tab === 'Video' ? 'tutorial em vídeo' : 'manual PDF'}.`}
          action={!searchTerm ? <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Novo Tutorial</Button> : undefined}
        />
      ) : tab === 'Video' ? (
        <VideoGrid
          tutoriais={filtered}
          onEdit={openEdit}
          onDelete={(id, titulo) => { if (confirm(`Excluir "${titulo}"?`)) deleteMutation.mutate(id) }}
        />
      ) : (
        <PdfGrid
          tutoriais={filtered}
          onEdit={openEdit}
          onDelete={(id, titulo) => { if (confirm(`Excluir "${titulo}"?`)) deleteMutation.mutate(id) }}
        />
      )}
    </div>
  )
}

// ============================================================
// Grid de Vídeos
// ============================================================

function VideoGrid({ tutoriais, onEdit, onDelete }: {
  tutoriais: Tutorial[]
  onEdit: (id: string) => void
  onDelete: (id: string, titulo: string) => void
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tutoriais.map((t) => (
        <div key={t.id} className="group overflow-hidden rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow">
          {/* Video embed */}
          <div className="relative aspect-video bg-gray-900">
            {t.video ? (
              isEmbeddable(t.video) ? (
                <iframe
                  src={getEmbedUrl(t.video)}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={t.video} className="h-full w-full object-cover" controls preload="metadata" />
              )
            ) : (
              <div className="flex h-full items-center justify-center">
                <PlayCircle className="h-12 w-12 text-gray-600" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 line-clamp-2">{t.titulo ?? 'Sem título'}</h3>
            {t.descricao && (
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">{t.descricao}</p>
            )}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {t.created_at ? new Date(t.created_at).toLocaleDateString('pt-BR') : ''}
              </span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(t.id)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => onDelete(t.id, t.titulo ?? '')} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// Grid de PDFs
// ============================================================

function PdfGrid({ tutoriais, onEdit, onDelete }: {
  tutoriais: Tutorial[]
  onEdit: (id: string) => void
  onDelete: (id: string, titulo: string) => void
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tutoriais.map((t) => (
        <div key={t.id} className="group overflow-hidden rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow">
          {/* PDF preview area */}
          <div className="relative h-40 bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
            <FileText className="h-16 w-16 text-red-400" />
            {t.pdf && (
              <a
                href={t.pdf}
                target="_blank"
                rel="noreferrer"
                className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors"
                title="Abrir PDF"
              >
                <span className="sr-only">Abrir PDF</span>
              </a>
            )}
          </div>

          {/* Info */}
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 line-clamp-2">{t.titulo ?? 'Sem título'}</h3>
            {t.descricao && (
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">{t.descricao}</p>
            )}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {t.created_at ? new Date(t.created_at).toLocaleDateString('pt-BR') : ''}
                </span>
                {t.pdf && (
                  <a href={t.pdf} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    <ExternalLink className="h-3 w-3" /> Abrir
                  </a>
                )}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(t.id)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => onDelete(t.id, t.titulo ?? '')} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// Form modal de criar/editar
// ============================================================

function TutorialForm({ editing, defaultTipo, onClose }: { editing?: Tutorial; defaultTipo: TipoTutorial; onClose: () => void }) {
  const [tipo, setTipo] = useState<TipoTutorial>((editing?.tipo_tutorial as TipoTutorial) ?? defaultTipo)
  const [titulo, setTitulo] = useState(editing?.titulo ?? '')
  const [descricao, setDescricao] = useState(editing?.descricao ?? '')
  const [video, setVideo] = useState<string | null>(editing?.video ?? null)
  const [pdf, setPdf] = useState<string | null>(editing?.pdf ?? null)
  const [destinatario, setDestinatario] = useState<Destinatario>(((editing as any)?.destinatario as Destinatario) ?? 'professor')
  const [error, setError] = useState('')

  const createMutation = useCreateTutorial()
  const updateMutation = useUpdateTutorial()
  const isSaving = createMutation.isPending || updateMutation.isPending

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) { setError('Título é obrigatório'); return }
    if (tipo === 'Video' && !video) { setError('Adicione um vídeo (URL ou upload)'); return }
    if (tipo === 'PDF' && !pdf) { setError('Faça upload do PDF'); return }
    try {
      const payload = {
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        tipo_tutorial: tipo,
        video: tipo === 'Video' ? video : null,
        pdf: tipo === 'PDF' ? pdf : null,
        destinatario,
      }
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, ...payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tipo selector */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Tipo</label>
        <div className="flex gap-2">
          {(['Video', 'PDF'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                tipo === t
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t === 'Video' ? <Video className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              {t === 'Video' ? 'Vídeo' : 'PDF / Manual'}
            </button>
          ))}
        </div>
      </div>

      {/* Upload area */}
      {tipo === 'Video' ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">URL do Vídeo (YouTube, Vimeo, etc.)</label>
            <Input
              placeholder="https://www.youtube.com/watch?v=..."
              value={video ?? ''}
              onChange={(e) => setVideo(e.target.value || null)}
            />
          </div>
          <div className="relative flex items-center">
            <div className="flex-grow border-t border-gray-200" />
            <span className="mx-3 text-xs text-gray-400">ou</span>
            <div className="flex-grow border-t border-gray-200" />
          </div>
          <FileUpload
            label="Upload de Vídeo"
            accept="video/*"
            type="video"
            value={video && !isUrl(video) ? video : null}
            onChange={(url) => setVideo(url)}
            onUpload={(file) => uploadFile('tutoriais', file, 'videos')}
          />
        </div>
      ) : (
        <FileUpload
          label="Arquivo PDF"
          accept=".pdf,application/pdf"
          type="pdf"
          value={pdf}
          onChange={setPdf}
          onUpload={(file) => uploadFile('tutoriais', file, 'pdfs')}
        />
      )}

      {/* Título */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Título</label>
        <Input placeholder="Título do tutorial" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
      </div>

      {/* Descrição */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Descrição</label>
        <textarea
          className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          rows={4}
          placeholder="Descrição do tutorial..."
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
      </div>

      {/* Destinatário */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Destinatário</label>
        <Select
          options={DESTINATARIO_OPTIONS}
          value={destinatario}
          onChange={(e) => setDestinatario(e.target.value as Destinatario)}
        />
        <p className="text-xs text-gray-400">Define quem poderá ver este tutorial.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Salvando...' : editing ? 'Salvar' : 'Criar Tutorial'}
        </Button>
      </div>
    </form>
  )
}

// ============================================================
// Helpers
// ============================================================

function isUrl(s: string) {
  return s.startsWith('http://') || s.startsWith('https://')
}

function isEmbeddable(url: string) {
  return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')
}

function getEmbedUrl(url: string): string {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  return url
}
