import { useState, useEffect, type FormEvent, type ReactNode } from 'react'
import {
  Plus, FolderOpen, FolderClosed, FileText, Trash2, Pencil, ChevronRight, ChevronDown,
  Music, HelpCircle, AlignLeft, Upload, Loader2, Search, MoreHorizontal,
} from 'lucide-react'
import {
  usePacotesLeis, useCreatePacoteLei, useDeletePacoteLei,
  useSubpastasLeis, useCreateSubpastaLei, useDeleteSubpastaLei,
  useLeis, useLei, useCreateLei, useUpdateLei, useDeleteLei,
  useAudioLeis, useCreateAudioLei, useDeleteAudioLei,
  useQuestoesLeis, useCreateQuestaoLei, useUpdateQuestaoLei, useDeleteQuestaoLei,
} from './content-hooks'
import { uploadFile } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import { FileUpload } from '@/components/ui/file-upload'

const TABS = [
  { tipo: 1, label: 'Pacotes' },
  { tipo: 2, label: 'Federais' },
  { tipo: 3, label: 'Estaduais' },
  { tipo: 4, label: 'Municipais' },
] as const

interface Selection {
  pacoteId?: string
  subpastaId?: string
  leiId?: string
}

export function AudioCursosPage() {
  const [activeTab, setActiveTab] = useState(1)
  const [selection, setSelection] = useState<Selection>({})
  const [search, setSearch] = useState('')

  function handleTabChange(tipo: number) {
    setActiveTab(tipo)
    setSelection({})
  }

  function selectPacote(id: string) {
    setSelection((s) => s.pacoteId === id ? {} : { pacoteId: id })
  }

  function selectSubpasta(pacoteId: string, id: string) {
    setSelection((s) => s.subpastaId === id ? { pacoteId } : { pacoteId, subpastaId: id })
  }

  function selectLei(pacoteId: string, subpastaId: string, leiId: string) {
    setSelection({ pacoteId, subpastaId, leiId })
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Audio Cursos</h1>

      <div className="flex gap-4 h-[calc(100vh-180px)]">
        {/* Sidebar */}
        <div className="w-72 shrink-0 flex flex-col rounded-lg border border-gray-200 bg-white overflow-hidden">
          {/* Tabs no topo da sidebar */}
          <div className="flex border-b border-gray-200">
            {TABS.map((tab) => (
              <button
                key={tab.tipo}
                onClick={() => handleTabChange(tab.tipo)}
                className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
                  activeTab === tab.tipo
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Busca */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-xs focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Tree */}
          <div className="flex-1 overflow-y-auto p-1">
            <SidebarTree
              tipo={activeTab}
              selection={selection}
              search={search}
              onSelectPacote={selectPacote}
              onSelectSubpasta={selectSubpasta}
              onSelectLei={selectLei}
            />
          </div>

          {/* Ações rápidas */}
          <SidebarActions tipo={activeTab} selection={selection} />
        </div>

        {/* Main Panel */}
        <div className="flex-1 rounded-lg border border-gray-200 bg-white overflow-y-auto">
          <MainPanel selection={selection} />
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Sidebar Tree
// ============================================================

function SidebarTree({
  tipo, selection, search,
  onSelectPacote, onSelectSubpasta, onSelectLei,
}: {
  tipo: number
  selection: Selection
  search: string
  onSelectPacote: (id: string) => void
  onSelectSubpasta: (pacoteId: string, id: string) => void
  onSelectLei: (pacoteId: string, subpastaId: string, leiId: string) => void
}) {
  const { data: pacotes, isLoading } = usePacotesLeis(tipo)
  const deleteMutation = useDeletePacoteLei()

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
  }

  const filtered = search
    ? (pacotes ?? []).filter((p) => p.nome?.toLowerCase().includes(search.toLowerCase()))
    : (pacotes ?? [])

  if (!filtered.length) {
    return <p className="px-3 py-6 text-center text-xs text-gray-400">Nenhuma pasta encontrada</p>
  }

  return (
    <div className="space-y-0.5">
      {filtered.map((p) => (
        <PastaNode
          key={p.id}
          pacote={p}
          isExpanded={selection.pacoteId === p.id}
          selection={selection}
          search={search}
          onToggle={() => onSelectPacote(p.id)}
          onSelectSubpasta={(subId) => onSelectSubpasta(p.id, subId)}
          onSelectLei={(subId, leiId) => onSelectLei(p.id, subId, leiId)}
          onDelete={() => { if (confirm(`Excluir "${p.nome}"?`)) deleteMutation.mutate(p.id) }}
        />
      ))}
    </div>
  )
}

function PastaNode({
  pacote, isExpanded, selection, search,
  onToggle, onSelectSubpasta, onSelectLei, onDelete,
}: {
  pacote: any
  isExpanded: boolean
  selection: Selection
  search: string
  onToggle: () => void
  onSelectSubpasta: (id: string) => void
  onSelectLei: (subId: string, leiId: string) => void
  onDelete: () => void
}) {
  const { data: subpastas } = useSubpastasLeis(isExpanded ? pacote.id : undefined)
  const deleteSubMutation = useDeleteSubpastaLei()

  return (
    <div>
      <TreeItem
        icon={isExpanded ? <FolderOpen className="h-4 w-4 text-blue-500" /> : <FolderClosed className="h-4 w-4 text-blue-400" />}
        label={pacote.nome ?? 'Sem nome'}
        isExpanded={isExpanded}
        isSelected={selection.pacoteId === pacote.id && !selection.subpastaId}
        onToggle={onToggle}
        onDelete={onDelete}
        depth={0}
      />
      {isExpanded && subpastas && (
        <div>
          {subpastas.map((sub) => (
            <SubpastaNode
              key={sub.id}
              subpasta={sub}
              pacoteId={pacote.id}
              isExpanded={selection.subpastaId === sub.id}
              selection={selection}
              search={search}
              onToggle={() => onSelectSubpasta(sub.id)}
              onSelectLei={(leiId) => onSelectLei(sub.id, leiId)}
              onDelete={() => { if (confirm(`Excluir "${sub.nome}"?`)) deleteSubMutation.mutate(sub.id) }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SubpastaNode({
  subpasta, pacoteId, isExpanded, selection, search,
  onToggle, onSelectLei, onDelete,
}: {
  subpasta: any
  pacoteId: string
  isExpanded: boolean
  selection: Selection
  search: string
  onToggle: () => void
  onSelectLei: (leiId: string) => void
  onDelete: () => void
}) {
  const { data: leis } = useLeis(isExpanded ? subpasta.id : undefined)
  const deleteLeiMutation = useDeleteLei()

  return (
    <div>
      <TreeItem
        icon={isExpanded ? <FolderOpen className="h-3.5 w-3.5 text-amber-500" /> : <FolderClosed className="h-3.5 w-3.5 text-amber-400" />}
        label={subpasta.nome}
        isExpanded={isExpanded}
        isSelected={selection.subpastaId === subpasta.id && !selection.leiId}
        onToggle={onToggle}
        onDelete={onDelete}
        depth={1}
      />
      {isExpanded && leis && (
        <div>
          {leis.map((lei) => (
            <TreeItem
              key={lei.id}
              icon={<FileText className="h-3.5 w-3.5 text-gray-400" />}
              label={lei.nome}
              isSelected={selection.leiId === lei.id}
              onToggle={() => onSelectLei(lei.id)}
              onDelete={() => { if (confirm(`Excluir "${lei.nome}"?`)) deleteLeiMutation.mutate(lei.id) }}
              depth={2}
              isLeaf
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TreeItem({
  icon, label, isExpanded, isSelected, onToggle, onDelete, depth, isLeaf,
}: {
  icon: ReactNode
  label: string
  isExpanded?: boolean
  isSelected?: boolean
  onToggle: () => void
  onDelete: () => void
  depth: number
  isLeaf?: boolean
}) {
  const [showMenu, setShowMenu] = useState(false)
  const pl = depth === 0 ? 'pl-2' : depth === 1 ? 'pl-6' : 'pl-10'

  return (
    <div
      className={`group flex items-center gap-1 rounded-md px-1 py-1 cursor-pointer text-sm transition-colors ${pl} ${
        isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
      }`}
      onClick={onToggle}
      onContextMenu={(e) => { e.preventDefault(); setShowMenu(!showMenu) }}
    >
      {!isLeaf ? (
        isExpanded ? <ChevronDown className="h-3 w-3 shrink-0 text-gray-400" /> : <ChevronRight className="h-3 w-3 shrink-0 text-gray-400" />
      ) : (
        <span className="w-3" />
      )}
      {icon}
      <span className="flex-1 truncate text-xs font-medium">{label}</span>
      <button
        onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200"
      >
        <MoreHorizontal className="h-3 w-3 text-gray-400" />
      </button>
      {showMenu && (
        <div className="absolute right-2 z-10 mt-1 rounded-md border border-gray-200 bg-white py-1 shadow-lg" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => { setShowMenu(false); onDelete() }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3" /> Excluir
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Sidebar Actions
// ============================================================

function SidebarActions({ tipo, selection }: { tipo: number; selection: Selection }) {
  const [modal, setModal] = useState<'pasta' | 'subpasta' | 'lei' | null>(null)
  const [nome, setNome] = useState('')
  const [error, setError] = useState('')

  const createPacote = useCreatePacoteLei()
  const createSubpasta = useCreateSubpastaLei()
  const createLei = useCreateLei()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    setError('')
    try {
      if (modal === 'pasta') {
        await createPacote.mutateAsync({ nome: nome.trim(), tipo })
      } else if (modal === 'subpasta' && selection.pacoteId) {
        await createSubpasta.mutateAsync({ nome: nome.trim(), pacoteLeiId: selection.pacoteId })
      } else if (modal === 'lei' && selection.subpastaId) {
        await createLei.mutateAsync({ nome: nome.trim(), subpasta_id: selection.subpastaId })
      }
      setNome('')
      setModal(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar')
    }
  }

  const isPending = createPacote.isPending || createSubpasta.isPending || createLei.isPending

  return (
    <>
      <div className="border-t border-gray-200 p-2 space-y-1">
        <button
          onClick={() => { setNome(''); setError(''); setModal('pasta') }}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
        >
          <Plus className="h-3 w-3" /> Nova Pasta
        </button>
        {selection.pacoteId && (
          <button
            onClick={() => { setNome(''); setError(''); setModal('subpasta') }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
          >
            <Plus className="h-3 w-3" /> Nova Subpasta
          </button>
        )}
        {selection.subpastaId && (
          <button
            onClick={() => { setNome(''); setError(''); setModal('lei') }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
          >
            <Plus className="h-3 w-3" /> Nova Lei
          </button>
        )}
      </div>

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal === 'pasta' ? 'Nova Pasta' : modal === 'subpasta' ? 'Nova Subpasta' : 'Nova Lei'}
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            placeholder="Nome..."
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoFocus
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setModal(null)}>Cancelar</Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? 'Criando...' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

// ============================================================
// Main Panel
// ============================================================

function MainPanel({ selection }: { selection: Selection }) {
  if (selection.leiId) {
    return <LeiDetailPanel leiId={selection.leiId} />
  }

  if (selection.subpastaId) {
    return <SubpastaDetailPanel subpastaId={selection.subpastaId} selection={selection} />
  }

  if (selection.pacoteId) {
    return <PacoteDetailPanel pacoteId={selection.pacoteId} />
  }

  return (
    <div className="flex h-full items-center justify-center">
      <EmptyState
        icon={<FolderOpen className="h-12 w-12" />}
        title="Selecione um item"
        description="Escolha uma pasta, subpasta ou lei na navegação à esquerda."
      />
    </div>
  )
}

function PacoteDetailPanel({ pacoteId }: { pacoteId: string }) {
  const { data: subpastas } = useSubpastasLeis(pacoteId)

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Subpastas</h2>
      {!subpastas?.length ? (
        <p className="text-sm text-gray-500">Nenhuma subpasta. Use o botão "+ Nova Subpasta" na sidebar.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {subpastas.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3">
              <FolderOpen className="h-5 w-5 text-amber-500" />
              <span className="font-medium text-gray-900 text-sm">{s.nome}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SubpastaDetailPanel({ subpastaId, selection }: { subpastaId: string; selection: Selection }) {
  const { data: leis } = useLeis(subpastaId)

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Leis</h2>
      {!leis?.length ? (
        <p className="text-sm text-gray-500">Nenhuma lei. Use o botão "+ Nova Lei" na sidebar.</p>
      ) : (
        <div className="space-y-2">
          {leis.map((lei) => (
            <LeiCard key={lei.id} lei={lei} />
          ))}
        </div>
      )}
    </div>
  )
}

function LeiCard({ lei }: { lei: any }) {
  const { data: audios } = useAudioLeis(lei.id)
  const { data: questoes } = useQuestoesLeis(lei.id)

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 hover:border-blue-200 transition-colors">
      <div className="flex items-center gap-3">
        <FileText className="h-5 w-5 text-gray-400" />
        <div>
          <p className="text-sm font-medium text-gray-900">{lei.nome}</p>
          <p className="text-xs text-gray-500">
            {audios?.length ?? 0} áudios · {questoes?.length ?? 0} questões
            {lei.texto ? ' · texto disponível' : ''}
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Lei Detail (3 abas: Áudios, Questões, Texto)
// ============================================================

function LeiDetailPanel({ leiId }: { leiId: string }) {
  const [tab, setTab] = useState<'audios' | 'questoes' | 'texto'>('audios')
  const { data: lei } = useLei(leiId)
  const { data: audios } = useAudioLeis(leiId)
  const { data: questoes } = useQuestoesLeis(leiId)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">{lei?.nome ?? 'Carregando...'}</h2>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-gray-200 px-6">
        {([
          { key: 'audios' as const, label: 'Áudios', icon: Music, count: audios?.length },
          { key: 'questoes' as const, label: 'Questões', icon: HelpCircle, count: questoes?.length },
          { key: 'texto' as const, label: 'Texto', icon: AlignLeft },
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
            {t.count !== undefined && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'audios' && <AudiosTab leiId={leiId} />}
        {tab === 'questoes' && <QuestoesTab leiId={leiId} />}
        {tab === 'texto' && <TextoTab leiId={leiId} />}
      </div>
    </div>
  )
}

// --- Áudios Tab ---

function AudiosTab({ leiId }: { leiId: string }) {
  const { data: audios, isLoading } = useAudioLeis(leiId)
  const createMutation = useCreateAudioLei()
  const deleteMutation = useDeleteAudioLei()
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  async function handleUpload(file: File) {
    setUploading(true)
    setUploadError('')
    try {
      const url = await uploadFile('audiocursos', file, 'audios')
      await createMutation.mutateAsync({ lei_id: leiId, audio_url: url, titulo: file.name.replace(/\.\w+$/, '') })
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erro ao enviar áudio. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <label className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-6 text-sm text-gray-500 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600">
        {uploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Upload className="h-8 w-8" />}
        <span>{uploading ? 'Enviando...' : 'Clique para adicionar áudio'}</span>
        <input
          type="file"
          accept="audio/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = '' }}
        />
      </label>

      {uploadError && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{uploadError}</p>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : !audios?.length ? (
        <p className="text-sm text-gray-500">Nenhum áudio adicionado.</p>
      ) : (
        <div className="space-y-2">
          {audios.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
              <Music className="h-5 w-5 text-blue-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{a.titulo ?? 'Sem título'}</p>
                <audio controls src={a.audio_url} className="mt-1 w-full h-8" />
              </div>
              <button
                onClick={() => { if (confirm('Excluir este áudio?')) deleteMutation.mutate(a.id) }}
                className="text-gray-400 hover:text-red-600 shrink-0"
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

// --- Questões Tab ---

function QuestoesTab({ leiId }: { leiId: string }) {
  const { data: questoes, isLoading } = useQuestoesLeis(leiId)
  const deleteMutation = useDeleteQuestaoLei()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const editing = questoes?.find((q) => q.id === editingId)

  function openNew() { setEditingId(null); setModalOpen(true) }
  function openEdit(id: string) { setEditingId(id); setModalOpen(true) }
  function closeModal() { setModalOpen(false); setEditingId(null) }

  return (
    <div className="space-y-4">
      <Button onClick={openNew} size="sm">
        <Plus className="mr-1 h-4 w-4" /> Nova Questão
      </Button>

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Editar Questão' : 'Nova Questão'} maxWidth="max-w-3xl">
        <QuestaoForm leiId={leiId} editing={editing} onClose={closeModal} />
      </Modal>

      {isLoading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : !questoes?.length ? (
        <p className="text-sm text-gray-500">Nenhuma questão adicionada.</p>
      ) : (
        <div className="space-y-2">
          {questoes.map((q, i) => (
            <div key={q.id} className="rounded-lg border border-gray-200 bg-white px-4 py-3">
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-gray-900">
                  <span className="text-gray-400 mr-2">{i + 1}.</span>
                  {q.pergunta}
                </p>
                <div className="flex gap-1 shrink-0 ml-2">
                  <button onClick={() => openEdit(q.id)} className="text-gray-400 hover:text-gray-600 p-1"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => { if (confirm('Excluir?')) deleteMutation.mutate(q.id) }} className="text-gray-400 hover:text-red-600 p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              {q.alternativas && (
                <div className="mt-2 space-y-1">
                  {q.alternativas.map((alt, j) => (
                    <p key={j} className={`text-xs px-2 py-1 rounded ${alt === q.resposta ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-500'}`}>
                      {String.fromCharCode(65 + j)}) {alt}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function QuestaoForm({ leiId, editing, onClose }: { leiId: string; editing?: any; onClose: () => void }) {
  const [pergunta, setPergunta] = useState(editing?.pergunta ?? '')
  const [alternativas, setAlternativas] = useState<string[]>(editing?.alternativas ?? ['', '', '', ''])
  const [respostaIdx, setRespostaIdx] = useState(() => {
    if (editing?.resposta && editing?.alternativas) {
      const idx = (editing.alternativas as string[]).indexOf(editing.resposta)
      return idx >= 0 ? idx : 0
    }
    return 0
  })
  const [video, setVideo] = useState(editing?.video ?? '')
  const [respostaEscrita, setRespostaEscrita] = useState(editing?.resposta_escrita ?? '')
  const [error, setError] = useState('')

  const createMutation = useCreateQuestaoLei()
  const updateMutation = useUpdateQuestaoLei()
  const isSaving = createMutation.isPending || updateMutation.isPending

  function updateAlt(idx: number, value: string) {
    setAlternativas((prev) => prev.map((a, i) => i === idx ? value : a))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const filledAlts = alternativas.filter((a) => a.trim())
    if (!pergunta.trim()) { setError('Pergunta é obrigatória'); return }
    if (filledAlts.length < 2) { setError('Mínimo 2 alternativas'); return }
    const resposta = alternativas[respostaIdx]?.trim()
    if (!resposta) { setError('Selecione uma alternativa válida como resposta'); return }

    try {
      const payload = {
        lei_id: leiId,
        pergunta: pergunta.trim(),
        alternativas: filledAlts,
        resposta,
        video: video.trim() || null,
        resposta_escrita: respostaEscrita.trim() || null,
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
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Pergunta</label>
        <textarea
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          rows={3}
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          required
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Alternativas (marque a correta)</label>
        {alternativas.map((alt, i) => (
          <div key={i} className="flex items-start gap-2">
            <input
              type="radio"
              name="resposta"
              checked={respostaIdx === i}
              onChange={() => setRespostaIdx(i)}
              className="h-4 w-4 text-blue-600 mt-2"
            />
            <span className="text-sm text-gray-500 w-5 mt-2">{String.fromCharCode(65 + i)})</span>
            <textarea
              placeholder={`Alternativa ${String.fromCharCode(65 + i)}`}
              value={alt}
              onChange={(e) => updateAlt(i, e.target.value)}
              rows={2}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Resposta escrita (opcional)</label>
        <textarea
          placeholder="Resposta discursiva / explicação da questão"
          value={respostaEscrita}
          onChange={(e) => setRespostaEscrita(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Vídeo explicativo (opcional)</label>
        <Input placeholder="URL do vídeo (YouTube, Vimeo, etc.)" value={video} onChange={(e) => setVideo(e.target.value)} />
        <div className="relative flex items-center">
          <div className="flex-grow border-t border-gray-200" />
          <span className="mx-3 text-xs text-gray-400">ou</span>
          <div className="flex-grow border-t border-gray-200" />
        </div>
        <FileUpload
          label="Upload de Vídeo"
          accept="video/*"
          type="video"
          value={video && !video.startsWith('http') ? video : null}
          onChange={(url) => setVideo(url ?? '')}
          onUpload={(file) => uploadFile('audiocursos', file, 'videos')}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Salvando...' : editing ? 'Salvar' : 'Criar Questão'}
        </Button>
      </div>
    </form>
  )
}

// --- Texto Tab ---

function TextoTab({ leiId }: { leiId: string }) {
  const { data: lei, isLoading } = useLei(leiId)
  const updateMutation = useUpdateLei()
  const [texto, setTexto] = useState('')
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (lei && !initialized) {
      setTexto(lei.texto ?? '')
      setInitialized(true)
    }
  }, [lei, initialized])

  async function handleSave() {
    await updateMutation.mutateAsync({ id: leiId, texto: texto || null })
  }

  if (isLoading) return <p className="text-sm text-gray-400">Carregando...</p>

  return (
    <div className="space-y-4">
      <textarea
        className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        rows={15}
        placeholder="Texto da lei..."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Salvando...' : 'Salvar Texto'}
        </Button>
      </div>
    </div>
  )
}
