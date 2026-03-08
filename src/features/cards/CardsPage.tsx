import { useState, type FormEvent } from 'react'
import { Plus, Pencil, Trash2, X, Image as ImageIcon, Video } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useProfessorProfile } from '@/hooks/useProfile'
import { useCards, useCreateCard, useUpdateCard, useDeleteCard } from './hooks'
import type { PostProfessor } from './api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileUpload } from '@/components/ui/file-upload'
import { uploadFile, getVideoDuration } from '@/lib/storage'
import { EmptyState } from '@/components/ui/empty-state'

export function CardsPage() {
  const { user, isAdmin, isProfessor } = useAuthContext()
  const { data: profile } = useProfessorProfile(user?.id)
  const professorApproved = isAdmin || !isProfessor || (profile?.approval_status === 'aprovado' && !profile?.is_blocked)
  const { data: cards, isLoading } = useCards(profile?.id)
  const [showForm, setShowForm] = useState(false)
  const [editingCard, setEditingCard] = useState<PostProfessor | null>(null)

  function handleEdit(card: PostProfessor) {
    setEditingCard(card)
    setShowForm(true)
  }

  function handleCloseForm() {
    setShowForm(false)
    setEditingCard(null)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Cards</h1>
        {professorApproved && (
          <Button onClick={() => { setEditingCard(null); setShowForm(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            Criar novo card
          </Button>
        )}
      </div>

      {isProfessor && !isAdmin && !professorApproved && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800">
            {profile?.approval_status === 'reprovado'
              ? 'Seu cadastro foi reprovado. Entre em contato com o suporte para mais informações.'
              : 'Seu cadastro está em análise. Você poderá criar cards após a aprovação.'}
          </p>
        </div>
      )}

      {showForm && profile && (
        <CardForm
          professorId={profile.id}
          card={editingCard}
          onClose={handleCloseForm}
        />
      )}

      {!cards?.length ? (
        <EmptyState
          icon={<ImageIcon className="h-12 w-12" />}
          title="Nenhum card criado"
          description="Crie cards motivacionais para compartilhar com seus alunos."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <CardItem key={card.id} card={card} onEdit={() => handleEdit(card)} />
          ))}
        </div>
      )}
    </div>
  )
}

function CardItem({ card, onEdit }: { card: PostProfessor; onEdit: () => void }) {
  const deleteMutation = useDeleteCard()

  function handleDelete() {
    if (confirm('Excluir este card?')) {
      deleteMutation.mutate(card.id)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="flex justify-end gap-1 p-2">
        <button onClick={onEdit} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600">
          <Pencil className="h-4 w-4" />
        </button>
        <button onClick={handleDelete} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="px-4 pb-2">
        {card.descricao && (
          <p className="text-sm text-gray-700 mb-2">{card.descricao}</p>
        )}
      </div>

      {card.imagem && (
        <img src={card.imagem} alt="" className="w-full object-cover" />
      )}

      {card.video && (
        <video src={card.video} className="w-full" controls preload="metadata" />
      )}

      {!card.imagem && !card.video && (
        <div className="flex items-center justify-center h-32 bg-gray-50">
          <ImageIcon className="h-8 w-8 text-gray-300" />
        </div>
      )}
    </div>
  )
}

function CardForm({
  professorId, card, onClose,
}: {
  professorId: string; card: PostProfessor | null; onClose: () => void
}) {
  const createMutation = useCreateCard()
  const updateMutation = useUpdateCard()
  const MAX_VIDEO_SECONDS = 120

  const initialMediaType = card?.video ? 'video' : 'imagem'
  const [mediaType, setMediaType] = useState<'imagem' | 'video'>(initialMediaType)
  const [form, setForm] = useState({
    descricao: card?.descricao ?? '',
    imagem: card?.imagem ?? '',
    video: card?.video ?? '',
  })
  const [error, setError] = useState('')

  function handleChange(field: string, value: string | null) {
    setForm((f) => ({ ...f, [field]: value ?? '' }))
  }

  function handleMediaTypeChange(type: 'imagem' | 'video') {
    setMediaType(type)
    if (type === 'imagem') {
      setForm((f) => ({ ...f, video: '' }))
    } else {
      setForm((f) => ({ ...f, imagem: '' }))
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      const payload = {
        descricao: form.descricao || null,
        imagem: mediaType === 'imagem' ? (form.imagem || null) : null,
        video: mediaType === 'video' ? (form.video || null) : null,
      }
      if (card) {
        await updateMutation.mutateAsync({ id: card.id, ...payload })
      } else {
        await createMutation.mutateAsync({ professor_id: professorId, ...payload })
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  async function handleUploadImage(file: File) {
    return uploadFile('professores', file, 'cards')
  }

  async function handleUploadVideo(file: File, onProgress?: (percent: number) => void) {
    // Validate duration client-side
    const duration = await getVideoDuration(file)
    if (duration > MAX_VIDEO_SECONDS) {
      throw new Error(`O vídeo deve ter no máximo 2 minutos. Duração: ${Math.ceil(duration)}s`)
    }
    return uploadFile('professores', file, 'cards-videos', onProgress)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{card ? 'Editar card' : 'Novo card'}</h3>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Texto do card</label>
        <textarea
          value={form.descricao}
          onChange={(e) => handleChange('descricao', e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Escreva uma mensagem motivacional..."
        />
      </div>

      {/* Media type selector */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Tipo de mídia</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleMediaTypeChange('imagem')}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              mediaType === 'imagem'
                ? 'border-blue-500 bg-blue-100 text-blue-700'
                : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            Imagem
          </button>
          <button
            type="button"
            onClick={() => handleMediaTypeChange('video')}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              mediaType === 'video'
                ? 'border-blue-500 bg-blue-100 text-blue-700'
                : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Video className="h-4 w-4" />
            Vídeo (max 2min)
          </button>
        </div>
      </div>

      {mediaType === 'imagem' ? (
        <FileUpload
          label="Imagem"
          accept="image/*"
          value={form.imagem || null}
          onChange={(url) => handleChange('imagem', url)}
          onUpload={handleUploadImage}
          type="image"
        />
      ) : (
        <FileUpload
          label="Vídeo (máximo 2 minutos)"
          accept="video/*"
          value={form.video || null}
          onChange={(url) => handleChange('video', url)}
          onUpload={handleUploadVideo}
          type="video"
        />
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
          {(createMutation.isPending || updateMutation.isPending) ? 'Salvando...' : card ? 'Salvar' : 'Criar'}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        {error && <p className="text-sm text-red-600 self-center">{error}</p>}
      </div>
    </form>
  )
}
