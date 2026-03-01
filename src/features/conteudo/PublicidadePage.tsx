import { useState, type FormEvent } from 'react'
import { Megaphone, Plus, Trash2, Pencil, Image, Monitor, Users, Headphones } from 'lucide-react'
import {
  useBanners, useCreateBanner, useUpdateBanner, useDeleteBanner,
  usePublicidadeAbertura, useCreatePublicidadeAbertura, useUpdatePublicidadeAbertura, useDeletePublicidadeAbertura,
  usePublicidadeAreaAluno, useCreatePublicidadeAreaAluno, useUpdatePublicidadeAreaAluno, useDeletePublicidadeAreaAluno,
  usePublicidadeAudioCurso, useCreatePublicidadeAudioCurso, useUpdatePublicidadeAudioCurso, useDeletePublicidadeAudioCurso,
} from './content-hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Modal } from '@/components/ui/modal'
import { FileUpload } from '@/components/ui/file-upload'
import { uploadFile } from '@/lib/storage'
import { cn } from '@/lib/cn'

type TabKey = 'banners' | 'abertura' | 'area-aluno' | 'audio-curso'

const TABS: { key: TabKey; label: string; icon: typeof Megaphone }[] = [
  { key: 'banners', label: 'Banners App', icon: Megaphone },
  { key: 'abertura', label: 'Tela de Abertura', icon: Monitor },
  { key: 'area-aluno', label: 'Area do Aluno', icon: Users },
  { key: 'audio-curso', label: 'Audio Cursos', icon: Headphones },
]

export function PublicidadePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('banners')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Publicidade</h1>

      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'banners' && <TabBanners />}
      {activeTab === 'abertura' && <TabAbertura />}
      {activeTab === 'area-aluno' && <TabAreaAluno />}
      {activeTab === 'audio-curso' && <TabAudioCurso />}
    </div>
  )
}

// ─── Shared Image Card ──────────────────────────────────────────────────────

interface ImageCardProps {
  id: string
  imagem: string | null
  link?: string | null
  isActive: boolean
  showLink?: boolean
  bucket: string
  folder: string
  onToggle: (id: string, active: boolean) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, data: { imagem?: string; link?: string | null }) => void
  isUpdating?: boolean
}

function ImageCard({ id, imagem, link, isActive, showLink, bucket, folder, onToggle, onDelete, onUpdate, isUpdating }: ImageCardProps) {
  const [editing, setEditing] = useState(false)
  const [editLink, setEditLink] = useState(link ?? '')
  const [editImagem, setEditImagem] = useState<string | null>(imagem)
  const [editError, setEditError] = useState('')

  function handleSave() {
    const trimmedLink = editLink.trim()
    if (showLink && trimmedLink && !trimmedLink.startsWith('https://') && !trimmedLink.startsWith('http://')) {
      setEditError('O link deve começar com https:// ou http://'); return
    }
    setEditError('')
    const updates: { imagem?: string; link?: string | null } = {}
    if (editImagem && editImagem !== imagem) updates.imagem = editImagem
    if (showLink) updates.link = trimmedLink || null
    onUpdate(id, updates)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
        <FileUpload
          label="Imagem"
          accept="image/*"
          type="image"
          value={editImagem}
          onChange={setEditImagem}
          onUpload={(file) => uploadFile(bucket, file, folder)}
        />
        {showLink && (
          <div>
            <label className="text-sm font-medium text-gray-700">Link de redirecionamento</label>
            <Input value={editLink} onChange={(e) => setEditLink(e.target.value)} placeholder="https://..." />
          </div>
        )}
        {editError && <p className="text-sm text-red-600">{editError}</p>}
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => { setEditing(false); setEditLink(link ?? ''); setEditImagem(imagem); setEditError('') }}>
            Cancelar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      {imagem ? (
        <img src={imagem} alt="" className="h-40 w-full object-cover" />
      ) : (
        <div className="h-40 bg-gray-100 flex items-center justify-center">
          <Image className="h-8 w-8 text-gray-300" />
        </div>
      )}
      <div className="p-3 space-y-2">
        {link && <p className="text-xs text-gray-500 truncate">{link}</p>}
        <div className="flex items-center justify-between">
          <Badge variant={isActive ? 'success' : 'default'}>
            {isActive ? 'Ativo' : 'Inativo'}
          </Badge>
          <div className="flex gap-1">
            <button
              onClick={() => setEditing(true)}
              className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => onToggle(id, !isActive)}
              className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
            >
              {isActive ? 'Desativar' : 'Ativar'}
            </button>
            <button
              onClick={() => { if (confirm('Excluir esta imagem?')) onDelete(id) }}
              className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Shared Add Form ────────────────────────────────────────────────────────

interface AddImageFormProps {
  bucket: string
  folder: string
  showLink?: boolean
  onSubmit: (data: { imagem: string; link?: string | null }) => Promise<void>
  onClose: () => void
  isPending: boolean
}

function AddImageForm({ bucket, folder, showLink, onSubmit, onClose, isPending }: AddImageFormProps) {
  const [imagem, setImagem] = useState<string | null>(null)
  const [link, setLink] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!imagem) { setError('Imagem é obrigatória'); return }
    const trimmedLink = link.trim()
    if (showLink && trimmedLink && !trimmedLink.startsWith('https://') && !trimmedLink.startsWith('http://')) {
      setError('O link deve começar com https:// ou http://'); return
    }
    setError('')
    try {
      await onSubmit({ imagem, link: showLink ? (trimmedLink || null) : null })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <FileUpload
        label="Imagem *"
        accept="image/*"
        type="image"
        value={imagem}
        onChange={setImagem}
        onUpload={(file) => uploadFile(bucket, file, folder)}
      />
      {showLink && (
        <div>
          <label className="text-sm font-medium text-gray-700">Link de redirecionamento</label>
          <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isPending}>{isPending ? 'Salvando...' : 'Criar'}</Button>
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
      </div>
    </form>
  )
}

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  )
}

// ─── Tab Banners ────────────────────────────────────────────────────────────

function TabBanners() {
  const { data: banners, isLoading } = useBanners()
  const [showForm, setShowForm] = useState(false)
  const createMutation = useCreateBanner()
  const updateMutation = useUpdateBanner()
  const deleteMutation = useDeleteBanner()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Banners exibidos no carousel da home do app do aluno.</p>
        <Button size="sm" onClick={() => setShowForm(true)}><Plus className="mr-1.5 h-4 w-4" />Novo Banner</Button>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Novo Banner">
        <AddImageForm
          bucket="publicidade"
          folder="banners"
          showLink
          onSubmit={async (data) => {
            await createMutation.mutateAsync({
              imagem: data.imagem,
              redirecionamento: data.link,
              sort_order: banners?.length ?? 0,
            })
          }}
          onClose={() => setShowForm(false)}
          isPending={createMutation.isPending}
        />
      </Modal>

      {isLoading ? <Spinner /> : !banners?.length ? (
        <EmptyState icon={<Megaphone className="h-12 w-12" />} title="Nenhum banner" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {banners.map((b) => (
            <ImageCard
              key={b.id}
              id={b.id}
              imagem={b.imagem}
              link={b.redirecionamento}
              isActive={b.is_active ?? true}
              showLink
              bucket="publicidade"
              folder="banners"
              onToggle={(id, active) => updateMutation.mutate({ id, is_active: active })}
              onDelete={(id) => deleteMutation.mutate(id)}
              onUpdate={(id, data) => updateMutation.mutate({ id, imagem: data.imagem, redirecionamento: data.link })}
              isUpdating={updateMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tab Abertura ───────────────────────────────────────────────────────────

const PLATAFORMAS = [
  { key: 'App 1', label: 'App 1' },
  { key: 'App 2', label: 'App 2' },
  { key: 'App 3', label: 'App 3' },
  { key: 'Painel', label: 'Painel' },
]

function TabAbertura() {
  const { data: items, isLoading } = usePublicidadeAbertura()
  const createMutation = useCreatePublicidadeAbertura()
  const updateMutation = useUpdatePublicidadeAbertura()
  const deleteMutation = useDeletePublicidadeAbertura()
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null)

  const byPlataforma = new Map(
    (items ?? []).map((item) => [(item as unknown as { plataforma: string }).plataforma, item]),
  )

  async function handleUpload(plataforma: string, file: File) {
    setUploadingSlot(plataforma)
    try {
      const url = await uploadFile('publicidade', file, 'abertura')
      const existing = byPlataforma.get(plataforma)
      if (existing) {
        await updateMutation.mutateAsync({ id: existing.id, imagem: url })
      } else {
        await createMutation.mutateAsync({ imagem: url, plataforma })
      }
    } finally {
      setUploadingSlot(null)
    }
  }

  function handleDelete(plataforma: string) {
    const existing = byPlataforma.get(plataforma)
    if (existing && confirm('Excluir esta imagem?')) {
      deleteMutation.mutate(existing.id)
    }
  }

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Imagens exibidas como slides ao abrir o app ou painel. Aparecem na tela de splash/onboarding antes do login. Uma imagem por plataforma.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {PLATAFORMAS.map(({ key, label }) => {
          const item = byPlataforma.get(key)
          const isUploading = uploadingSlot === key
          return (
            <div key={key} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
                <p className="text-sm font-semibold text-gray-700">{label}</p>
                {item && (
                  <button
                    onClick={() => handleDelete(key)}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    title="Excluir"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {item?.imagem ? (
                <img src={item.imagem} alt={label} className="h-40 w-full object-cover" />
              ) : (
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  <Image className="h-8 w-8 text-gray-300" />
                </div>
              )}

              <div className="p-2">
                <label className="flex items-center justify-center gap-1.5 cursor-pointer rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  {isUploading ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  {isUploading ? 'Enviando...' : item ? 'Alterar' : 'Adicionar'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUpload(key, file)
                      e.target.value = ''
                    }}
                  />
                </label>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Tab Area Aluno ─────────────────────────────────────────────────────────

function TabAreaAluno() {
  const { data: items, isLoading } = usePublicidadeAreaAluno()
  const [showForm, setShowForm] = useState(false)
  const createMutation = useCreatePublicidadeAreaAluno()
  const updateMutation = useUpdatePublicidadeAreaAluno()
  const deleteMutation = useDeletePublicidadeAreaAluno()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Banners exibidos na tela inicial (home) do app do aluno. Podem conter link de redirecionamento.</p>
        <Button size="sm" onClick={() => setShowForm(true)}><Plus className="mr-1.5 h-4 w-4" />Nova Imagem</Button>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nova Imagem - Area do Aluno">
        <AddImageForm
          bucket="publicidade"
          folder="area-aluno"
          showLink
          onSubmit={async (data) => {
            await createMutation.mutateAsync({ imagem: data.imagem, link: data.link })
          }}
          onClose={() => setShowForm(false)}
          isPending={createMutation.isPending}
        />
      </Modal>

      {isLoading ? <Spinner /> : !items?.length ? (
        <EmptyState icon={<Users className="h-12 w-12" />} title="Nenhuma imagem na area do aluno" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((b) => (
            <ImageCard
              key={b.id}
              id={b.id}
              imagem={b.imagem}
              link={b.link}
              isActive={b.is_active ?? true}
              showLink
              bucket="publicidade"
              folder="area-aluno"
              onToggle={(id, active) => updateMutation.mutate({ id, is_active: active })}
              onDelete={(id) => deleteMutation.mutate(id)}
              onUpdate={(id, data) => updateMutation.mutate({ id, imagem: data.imagem, link: data.link })}
              isUpdating={updateMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tab Audio Curso ────────────────────────────────────────────────────────

function TabAudioCurso() {
  const { data: items, isLoading } = usePublicidadeAudioCurso()
  const [showForm, setShowForm] = useState(false)
  const createMutation = useCreatePublicidadeAudioCurso()
  const updateMutation = useUpdatePublicidadeAudioCurso()
  const deleteMutation = useDeletePublicidadeAudioCurso()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Imagens exibidas na secao de audio cursos do app.</p>
        <Button size="sm" onClick={() => setShowForm(true)}><Plus className="mr-1.5 h-4 w-4" />Nova Imagem</Button>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nova Imagem - Audio Cursos">
        <AddImageForm
          bucket="publicidade"
          folder="audio-curso"
          showLink
          onSubmit={async (data) => {
            await createMutation.mutateAsync({ imagem: data.imagem, link: data.link })
          }}
          onClose={() => setShowForm(false)}
          isPending={createMutation.isPending}
        />
      </Modal>

      {isLoading ? <Spinner /> : !items?.length ? (
        <EmptyState icon={<Headphones className="h-12 w-12" />} title="Nenhuma imagem de audio curso" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((b) => (
            <ImageCard
              key={b.id}
              id={b.id}
              imagem={b.imagem}
              link={b.link}
              isActive={b.is_active ?? true}
              showLink
              bucket="publicidade"
              folder="audio-curso"
              onToggle={(id, active) => updateMutation.mutate({ id, is_active: active })}
              onDelete={(id) => deleteMutation.mutate(id)}
              onUpdate={(id, data) => updateMutation.mutate({ id, imagem: data.imagem, link: data.link })}
              isUpdating={updateMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}
