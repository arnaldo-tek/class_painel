import { useState, type FormEvent } from 'react'
import {
  Users, Plus, Pencil, Trash2, Search, MessageSquare, UserX, Ban,
  ChevronLeft, ShieldAlert, ShieldCheck,
} from 'lucide-react'
import {
  useComunidades, useComunidade, useCreateComunidade, useUpdateComunidade, useDeleteComunidade,
  useMembros, useSuspenderMembro, useRemoveMembro,
  useMensagens, useDeleteMensagem,
} from './hooks'
import { useCategorias } from '@/features/categorias/hooks'
import { uploadFile } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { FileUpload } from '@/components/ui/file-upload'
import { EmptyState } from '@/components/ui/empty-state'

export function ComunidadesPage() {
  const { data: comunidades, isLoading } = useComunidades()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState('')
  const deleteMutation = useDeleteComunidade()

  const { data: categoriasData } = useCategorias()
  const categorias = categoriasData?.categorias ?? []

  const editing = comunidades?.find((c) => c.id === editingId)

  const filtered = (comunidades ?? []).filter((c) => {
    if (searchTerm && !c.nome.toLowerCase().includes(searchTerm.toLowerCase())) return false
    if (categoriaFilter && c.categoria_id !== categoriaFilter) return false
    return true
  })

  function openNew() { setEditingId(null); setModalOpen(true) }
  function openEdit(id: string) { setEditingId(id); setModalOpen(true) }
  function closeModal() { setModalOpen(false); setEditingId(null) }

  // Se uma comunidade está selecionada, mostra a tela interna
  if (selectedId) {
    return <ComunidadeDetail comunidadeId={selectedId} onBack={() => setSelectedId(null)} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Comunidades</h1>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Nova Comunidade
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-1 min-w-[200px] gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar comunidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        <Select
          placeholder="Todas as categorias"
          options={categorias.map((c: any) => ({ value: c.id, label: c.nome }))}
          value={categoriaFilter}
          onChange={(e) => setCategoriaFilter(e.target.value)}
        />
      </div>

      {/* Modal criar/editar */}
      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Editar Comunidade' : 'Nova Comunidade'} maxWidth="max-w-lg">
        <ComunidadeForm editing={editing} onClose={closeModal} />
      </Modal>

      {/* Lista */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : !filtered.length ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="Nenhuma comunidade"
          description={searchTerm || categoriaFilter ? 'Nenhum resultado para os filtros.' : 'Crie a primeira comunidade.'}
          action={!searchTerm && !categoriaFilter ? <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Nova Comunidade</Button> : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <div key={c.id} className="group overflow-hidden rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow">
              {/* Imagem */}
              <div
                className="h-36 bg-gradient-to-br from-blue-100 to-blue-50 cursor-pointer"
                onClick={() => setSelectedId(c.id)}
              >
                {c.imagem ? (
                  <img src={c.imagem} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Users className="h-12 w-12 text-blue-300" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 cursor-pointer" onClick={() => setSelectedId(c.id)}>
                    <h3 className="font-semibold text-gray-900">{c.nome}</h3>
                    {c.categorias?.nome && (
                      <p className="text-xs text-gray-500 mt-0.5">{c.categorias.nome}</p>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(c.id)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Excluir "${c.nome}"?`)) deleteMutation.mutate(c.id) }}
                      className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Form de criar/editar comunidade
// ============================================================

function ComunidadeForm({ editing, onClose }: { editing?: any; onClose: () => void }) {
  const [nome, setNome] = useState(editing?.nome ?? '')
  const [categoriaId, setCategoriaId] = useState(editing?.categoria_id ?? '')
  const [imagem, setImagem] = useState<string | null>(editing?.imagem ?? null)
  const [error, setError] = useState('')

  const { data: categoriasData } = useCategorias()
  const categorias = categoriasData?.categorias ?? []

  const createMutation = useCreateComunidade()
  const updateMutation = useUpdateComunidade()
  const isSaving = createMutation.isPending || updateMutation.isPending

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) { setError('Nome é obrigatório'); return }
    try {
      const payload = {
        nome: nome.trim(),
        categoria_id: categoriaId || null,
        imagem,
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
      <FileUpload
        label="Imagem da Comunidade"
        accept="image/*"
        type="image"
        value={imagem}
        onChange={setImagem}
        onUpload={(file) => uploadFile('comunidades', file, 'imagens')}
      />

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Nome da Comunidade</label>
        <Input placeholder="Nome da comunidade" value={nome} onChange={(e) => setNome(e.target.value)} required />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Categoria</label>
        <Select
          placeholder="Selecionar categoria"
          options={categorias.map((c: any) => ({ value: c.id, label: c.nome }))}
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Salvando...' : editing ? 'Salvar' : 'Criar Comunidade'}
        </Button>
      </div>
    </form>
  )
}

// ============================================================
// Tela interna da comunidade (2 abas: Mensagens, Usuários)
// ============================================================

function ComunidadeDetail({ comunidadeId, onBack }: { comunidadeId: string; onBack: () => void }) {
  const { data: comunidade } = useComunidade(comunidadeId)
  const [tab, setTab] = useState<'mensagens' | 'usuarios' | 'regras'>('mensagens')
  const [regrasModalOpen, setRegrasModalOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
          <ChevronLeft className="h-4 w-4" /> Voltar
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{comunidade?.nome ?? 'Carregando...'}</h1>
          {comunidade?.categorias?.nome && (
            <p className="text-sm text-gray-500">{comunidade.categorias.nome}</p>
          )}
        </div>
        <Button variant="secondary" onClick={() => setRegrasModalOpen(true)}>
          <ShieldAlert className="mr-2 h-4 w-4" /> Regras
        </Button>
      </div>

      {/* Modal de regras */}
      <Modal open={regrasModalOpen} onClose={() => setRegrasModalOpen(false)} title="Regras da Comunidade" maxWidth="max-w-lg">
        <RegrasForm comunidadeId={comunidadeId} regras={comunidade?.regras ?? ''} onClose={() => setRegrasModalOpen(false)} />
      </Modal>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {([
          { key: 'mensagens' as const, label: 'Mensagens', icon: MessageSquare },
          { key: 'usuarios' as const, label: 'Usuários', icon: Users },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'mensagens' && <MensagensTab comunidadeId={comunidadeId} />}
      {tab === 'usuarios' && <UsuariosTab comunidadeId={comunidadeId} />}
    </div>
  )
}

// --- Regras Form ---

function RegrasForm({ comunidadeId, regras, onClose }: { comunidadeId: string; regras: string; onClose: () => void }) {
  const [texto, setTexto] = useState(regras)
  const updateMutation = useUpdateComunidade()

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    await updateMutation.mutateAsync({ id: comunidadeId, regras: texto || null })
    onClose()
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <textarea
        className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        rows={10}
        placeholder="Escreva as regras da comunidade..."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
      <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Salvando...' : 'Salvar Regras'}
        </Button>
      </div>
    </form>
  )
}

// --- Mensagens Tab ---

function MensagensTab({ comunidadeId }: { comunidadeId: string }) {
  const { data: mensagens, isLoading } = useMensagens(comunidadeId)
  const deleteMutation = useDeleteMensagem()
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = (mensagens ?? []).filter((m) => {
    if (!searchTerm) return true
    return (
      m.texto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar mensagens..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {!filtered.length ? (
        <p className="text-sm text-gray-500 py-6 text-center">Nenhuma mensagem.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <div key={m.id} className="flex gap-3 rounded-lg border border-gray-200 bg-white p-4">
              {/* Avatar */}
              <div className="h-9 w-9 shrink-0 rounded-full bg-gray-200 flex items-center justify-center">
                {m.profiles?.photo_url ? (
                  <img src={m.profiles.photo_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-gray-500">
                    {(m.profiles?.display_name ?? '?')[0].toUpperCase()}
                  </span>
                )}
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{m.profiles?.display_name ?? 'Usuário'}</span>
                  <span className="text-xs text-gray-400">
                    {m.created_at ? new Date(m.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{m.texto}</p>
              </div>

              {/* Excluir */}
              <button
                onClick={() => { if (confirm('Excluir esta mensagem?')) deleteMutation.mutate(m.id) }}
                className="shrink-0 text-gray-400 hover:text-red-600 p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// --- Usuários Tab ---

function UsuariosTab({ comunidadeId }: { comunidadeId: string }) {
  const { data: membros, isLoading } = useMembros(comunidadeId)
  const suspenderMutation = useSuspenderMembro()
  const removeMutation = useRemoveMembro()
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = (membros ?? []).filter((m) => {
    if (!searchTerm) return true
    return (
      m.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar usuário..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {!filtered.length ? (
        <p className="text-sm text-gray-500 py-6 text-center">Nenhum membro.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
              {/* Avatar */}
              <div className="h-10 w-10 shrink-0 rounded-full bg-gray-200 flex items-center justify-center">
                {m.profiles?.photo_url ? (
                  <img src={m.profiles.photo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-gray-500">
                    {(m.profiles?.display_name ?? '?')[0].toUpperCase()}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{m.profiles?.display_name ?? 'Sem nome'}</p>
                  {m.suspenso && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Suspenso</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{m.profiles?.email ?? ''}</p>
              </div>

              {/* Ações */}
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => suspenderMutation.mutate({ id: m.id, suspenso: !m.suspenso })}
                  className={`rounded p-1.5 ${m.suspenso ? 'text-green-600 hover:bg-green-50' : 'text-amber-500 hover:bg-amber-50'}`}
                  title={m.suspenso ? 'Reativar' : 'Suspender'}
                >
                  {m.suspenso ? <ShieldCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => { if (confirm(`Remover "${m.profiles?.display_name}" da comunidade?`)) removeMutation.mutate(m.id) }}
                  className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  title="Remover"
                >
                  <UserX className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
