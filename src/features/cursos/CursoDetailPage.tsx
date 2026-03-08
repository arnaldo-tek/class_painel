import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useParams, useNavigate, Link } from '@tanstack/react-router'
import {
  ArrowLeft, Plus, GripVertical, Pencil, Trash2, X,
  ChevronDown, ChevronRight, FileText, Image as ImageIcon,
  BookOpen, Music, HelpCircle, Upload, Loader2, Users, Layers,
  MessageCircle, Send, User,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/cn'
import { supabase } from '@/lib/supabase'
import { useCurso, useCursoEnrollments } from './hooks'
import {
  useModulos, useCreateModulo, useUpdateModulo, useDeleteModulo,
  useAulas, useCreateAula, useUpdateAula, useDeleteAula,
  useQuestoesAula, useCreateQuestaoAula, useUpdateQuestaoAula, useDeleteQuestaoAula,
  useAudiosAula, useCreateAudioAula, useDeleteAudioAula,
  useTextosAula, useCreateTextoAula, useUpdateTextoAula, useDeleteTextoAula,
  useFlashcardsAula, useCreateFlashcardAula, useUpdateFlashcardAula, useDeleteFlashcardAula,
} from './modulos-hooks'
import type { Modulo, Aula, QuestaoAula } from './modulos-api'
import type { CursoEnrollment } from './api'
import { useAuthContext } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { FileUpload } from '@/components/ui/file-upload'
import { Modal } from '@/components/ui/modal'
import { Tooltip } from '@/components/ui/tooltip'
import { uploadFile } from '@/lib/storage'

// ========================
// CursoDetailPage (main)
// ========================

export function CursoDetailPage() {
  const { cursoId } = useParams({ strict: false }) as { cursoId: string }
  const navigate = useNavigate()
  const { isAdmin } = useAuthContext()
  const { data: curso, isLoading: loadingCurso } = useCurso(cursoId)
  const { data: modulos, isLoading: loadingModulos } = useModulos(cursoId)
  const { data: enrollments, isLoading: loadingEnrollments } = useCursoEnrollments(cursoId)

  const [activeTab, setActiveTab] = useState<'modulos' | 'matriculados' | 'chat'>('modulos')
  const [showModuloForm, setShowModuloForm] = useState(false)
  const [editingModuloId, setEditingModuloId] = useState<string | null>(null)

  if (loadingCurso) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (!curso) return null

  const status = curso.is_encerrado
    ? { label: 'Encerrado', variant: 'danger' as const }
    : curso.is_publicado
      ? { label: 'Publicado', variant: 'success' as const }
      : { label: 'Rascunho', variant: 'warning' as const }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate({ to: '/cursos' })}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 truncate">{curso.nome}</h1>
          <p className="text-sm text-gray-500">Gerenciar modulos e aulas</p>
        </div>
        <Link to="/cursos/$cursoId/editar" params={{ cursoId }}>
          <Button variant="secondary">
            <Pencil className="mr-2 h-4 w-4" />
            Editar Curso
          </Button>
        </Link>
      </div>

      {/* Curso info card */}
      <div className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4">
        {curso.imagem ? (
          <img src={curso.imagem} alt="" className="h-24 w-36 rounded-lg object-cover flex-shrink-0" />
        ) : (
          <div className="flex h-24 w-36 items-center justify-center rounded-lg bg-gray-100 flex-shrink-0">
            <BookOpen className="h-8 w-8 text-gray-300" />
          </div>
        )}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            {curso.is_degustacao && <Badge variant="info">Degustacao</Badge>}
            {curso.categorias?.nome && <Badge>{curso.categorias.nome}</Badge>}
          </div>
          {curso.descricao && (
            <p className="text-sm text-gray-600 line-clamp-2">{curso.descricao}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
            <span>Professor: <strong className="text-gray-700">{curso.professor_profiles?.nome_professor ?? '—'}</strong></span>
            <span>Preco: <strong className="text-gray-700">{curso.preco ? `R$ ${Number(curso.preco).toFixed(2)}` : 'Gratis'}</strong></span>
            <span>Modulos: <strong className="text-gray-700">{modulos?.length ?? 0}</strong></span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('modulos')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === 'modulos'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
          )}
        >
          <BookOpen className="h-4 w-4" />
          Módulos ({modulos?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab('matriculados')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === 'matriculados'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
          )}
        >
          <Users className="h-4 w-4" />
          Alunos Matriculados ({enrollments?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === 'chat'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
          )}
        >
          <MessageCircle className="h-4 w-4" />
          Chat
        </button>
      </div>

      {/* Tab: Modulos */}
      {activeTab === 'modulos' && (
        <div className="space-y-3">
          <div className="flex items-center justify-end">
            <Button size="sm" onClick={() => { setShowModuloForm(true); setEditingModuloId(null) }}>
              <Plus className="mr-1 h-4 w-4" />
              Novo Modulo
            </Button>
          </div>

          {showModuloForm && (
            <ModuloForm
              cursoId={cursoId}
              editingId={editingModuloId}
              modulos={modulos ?? []}
              onClose={() => { setShowModuloForm(false); setEditingModuloId(null) }}
            />
          )}

          {loadingModulos ? (
            <LoadingSpinner />
          ) : !modulos?.length ? (
            <EmptyState
              icon={<BookOpen className="h-12 w-12" />}
              title="Nenhum modulo"
              description="Crie modulos para organizar as aulas do curso."
            />
          ) : (
            <div className="space-y-2">
              {modulos.map((modulo, idx) => (
                <ModuloCard
                  key={modulo.id}
                  modulo={modulo}
                  cursoId={cursoId}
                  index={idx}
                  isAdmin={isAdmin}
                  onEdit={() => { setEditingModuloId(modulo.id); setShowModuloForm(true) }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Alunos Matriculados */}
      {activeTab === 'matriculados' && (
        <MatriculadosSection enrollments={enrollments ?? []} loading={loadingEnrollments} />
      )}

      {/* Tab: Chat */}
      {activeTab === 'chat' && (
        <CursoChatSection enrollments={enrollments ?? []} loading={loadingEnrollments} />
      )}
    </div>
  )
}

// ========================
// MatriculadosSection
// ========================

const ENROLLMENTS_PER_PAGE = 15

function MatriculadosSection({ enrollments, loading }: { enrollments: CursoEnrollment[]; loading: boolean }) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const filtered = enrollments.filter((e) => {
    if (!search) return true
    const term = search.toLowerCase()
    return (
      e.profiles?.display_name?.toLowerCase().includes(term) ||
      e.profiles?.email?.toLowerCase().includes(term)
    )
  })

  const totalPages = Math.ceil(filtered.length / ENROLLMENTS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ENROLLMENTS_PER_PAGE, page * ENROLLMENTS_PER_PAGE)

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar aluno por nome ou email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="max-w-sm"
        />
        <span className="text-sm text-gray-500">{filtered.length} aluno(s)</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title={search ? 'Nenhum aluno encontrado' : 'Nenhum aluno matriculado'}
          description={search ? 'Tente outro termo de busca.' : 'Nenhum aluno se matriculou neste curso ainda.'}
        />
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-gray-200 bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
            <span>Aluno</span>
            <span>Data matrícula</span>
            <span>Status</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-100">
            {paginated.map((e) => (
              <div key={e.id} className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 text-xs font-bold flex-shrink-0">
                    {(e.profiles?.display_name || e.profiles?.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {e.profiles?.display_name || e.profiles?.email || 'Aluno'}
                    </p>
                    {e.profiles?.display_name && e.profiles?.email && (
                      <p className="text-xs text-gray-500 truncate">{e.profiles.email}</p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString('pt-BR') : '—'}
                </span>
                <div className="flex-shrink-0">
                  {e.is_suspended
                    ? <Badge variant="danger">Suspenso</Badge>
                    : <Badge variant="success">Ativo</Badge>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ========================
// CursoChatSection
// ========================

function CursoChatSection({ enrollments, loading }: { enrollments: CursoEnrollment[]; loading: boolean }) {
  const { user } = useAuthContext()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const qc = useQueryClient()

  const filtered = enrollments.filter((e) => {
    if (!search) return true
    const term = search.toLowerCase()
    return (
      e.profiles?.display_name?.toLowerCase().includes(term) ||
      e.profiles?.email?.toLowerCase().includes(term)
    )
  })

  // Buscar ou criar chat entre o professor e o aluno selecionado
  const { data: activeChatId, isLoading: loadingChat } = useQuery({
    queryKey: ['curso-chat', user?.id, selectedUserId],
    queryFn: async () => {
      if (!user || !selectedUserId) return null

      // Tentar encontrar chat existente
      const { data: existing } = await supabase
        .from('chats')
        .select('id')
        .or(`and(user_a.eq.${user.id},user_b.eq.${selectedUserId}),and(user_a.eq.${selectedUserId},user_b.eq.${user.id})`)
        .maybeSingle()

      if (existing) return existing.id

      // Criar novo chat
      const { data: created, error } = await supabase
        .from('chats')
        .insert({ user_a: user.id, user_b: selectedUserId })
        .select('id')
        .single()

      if (error) throw error
      return created.id
    },
    enabled: !!user && !!selectedUserId,
  })

  if (loading) return <LoadingSpinner />

  if (enrollments.length === 0) {
    return (
      <EmptyState
        icon={<MessageCircle className="h-12 w-12" />}
        title="Nenhum aluno matriculado"
        description="O chat ficara disponivel quando alunos se matricularem no curso."
      />
    )
  }

  return (
    <div className="flex h-[calc(100vh-22rem)] gap-4">
      {/* Lista de alunos */}
      <div className="w-72 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white flex flex-col">
        <div className="p-3 border-b border-gray-100 space-y-2">
          <h3 className="font-semibold text-sm text-gray-900">Alunos ({filtered.length})</h3>
          <Input
            placeholder="Buscar aluno..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm"
          />
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {filtered.map((e) => (
            <button
              key={e.user_id}
              onClick={() => setSelectedUserId(e.user_id)}
              className={cn(
                'w-full text-left px-3 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3',
                selectedUserId === e.user_id && 'bg-blue-50',
              )}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 text-xs font-bold shrink-0">
                {(e.profiles?.display_name || e.profiles?.email || '?')[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {e.profiles?.display_name || e.profiles?.email || 'Aluno'}
                </p>
                {e.profiles?.display_name && e.profiles?.email && (
                  <p className="text-xs text-gray-500 truncate">{e.profiles.email}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Area de mensagens */}
      {selectedUserId && activeChatId ? (
        <CursoChatMessages
          chatId={activeChatId}
          otherName={
            enrollments.find((e) => e.user_id === selectedUserId)?.profiles?.display_name ||
            enrollments.find((e) => e.user_id === selectedUserId)?.profiles?.email ||
            'Aluno'
          }
        />
      ) : loadingChat && selectedUserId ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center rounded-lg border border-gray-200 bg-white">
          <EmptyState
            icon={<MessageCircle className="h-12 w-12" />}
            title="Selecione um aluno"
            description="Escolha um aluno na lista para iniciar a conversa."
          />
        </div>
      )}
    </div>
  )
}

// ========================
// CursoChatMessages
// ========================

function CursoChatMessages({ chatId, otherName }: { chatId: string; otherName: string }) {
  const { user } = useAuthContext()
  const [text, setText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()

  const { data: messages } = useQuery({
    queryKey: ['chat-messages', chatId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data ?? []
    },
  })

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`curso-chat-${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `chat_id=eq.${chatId}` },
        () => {
          qc.invalidateQueries({ queryKey: ['chat-messages', chatId] })
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [chatId, qc])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMutation = useMutation({
    mutationFn: async (msg: string) => {
      const { error } = await supabase.from('chat_messages').insert({
        chat_id: chatId,
        user_id: user!.id,
        text: msg,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chat-messages', chatId] })
      qc.invalidateQueries({ queryKey: ['chats'] })
    },
  })

  function handleSend() {
    if (!text.trim()) return
    sendMutation.mutate(text.trim())
    setText('')
  }

  return (
    <div className="flex flex-1 flex-col rounded-lg border border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center">
          <User className="h-4 w-4 text-purple-500" />
        </div>
        <p className="font-semibold text-sm text-gray-900">{otherName}</p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!messages?.length ? (
          <p className="text-center text-sm text-gray-400 py-8">Nenhuma mensagem ainda. Envie a primeira!</p>
        ) : (
          messages.map((msg: any) => {
            const isMe = msg.user_id === user?.id
            return (
              <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[70%] rounded-lg px-3 py-2 text-sm',
                  isMe ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900',
                )}>
                  <p>{msg.text}</p>
                  <p className={cn('text-xs mt-1', isMe ? 'text-blue-200' : 'text-gray-400')}>
                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 px-4 py-3 flex items-center gap-3">
        <input
          type="text"
          placeholder="Digite uma mensagem..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sendMutation.isPending}
          className="h-11 w-11 shrink-0 rounded-xl bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

// ========================
// ModuloForm
// ========================

function ModuloForm({
  cursoId, editingId, modulos, onClose,
}: {
  cursoId: string; editingId: string | null; modulos: Modulo[]; onClose: () => void
}) {
  const existing = modulos.find((m) => m.id === editingId)
  const [nome, setNome] = useState(existing?.nome ?? '')
  const [error, setError] = useState('')
  const createMutation = useCreateModulo()
  const updateMutation = useUpdateModulo()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) { setError('Nome e obrigatorio'); return }
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, nome: nome.trim() })
      } else {
        await createMutation.mutateAsync({
          nome: nome.trim(),
          curso_id: cursoId,
          sort_order: modulos.length,
        })
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro')
    }
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <form onSubmit={handleSubmit} className="flex gap-3 items-end">
        <div className="flex-1">
          <Input
            placeholder="Nome do modulo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            autoFocus
          />
        </div>
        <Button type="submit" size="sm" disabled={createMutation.isPending || updateMutation.isPending}>
          {editingId ? 'Salvar' : 'Criar'}
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  )
}

// ========================
// ModuloCard
// ========================

function ModuloCard({
  modulo, cursoId, index, isAdmin, onEdit,
}: {
  modulo: Modulo; cursoId: string; index: number; isAdmin: boolean; onEdit: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [aulaModal, setAulaModal] = useState<{ mode: 'create' } | { mode: 'edit'; aula: Aula } | null>(null)
  const deleteMutation = useDeleteModulo()
  const { data: aulas } = useAulas(cursoId, modulo.id)

  function handleDelete() {
    if (confirm(`Excluir modulo "${modulo.nome}" e todas as suas aulas?`)) {
      deleteMutation.mutate(modulo.id)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      {/* Module header */}
      <div
        className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <GripVertical className="h-4 w-4 text-gray-300 cursor-grab flex-shrink-0" onClick={(e) => e.stopPropagation()} />
        <div className="text-gray-400 flex-shrink-0">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
        <span className="text-xs font-semibold text-gray-400 flex-shrink-0">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="flex-1 font-medium text-gray-900 truncate">{modulo.nome}</span>
        <Badge variant="default">{aulas?.length ?? 0} aulas</Badge>
        <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
          <Tooltip text="Editar modulo">
            <button onClick={onEdit} className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600">
              <Pencil className="h-4 w-4" />
            </button>
          </Tooltip>
          <Tooltip text="Excluir modulo">
            <button onClick={handleDelete} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Aulas list */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50">
          {(aulas ?? []).length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-400">Nenhuma aula neste modulo</p>
              <button
                onClick={() => setAulaModal({ mode: 'create' })}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-4 w-4" />
                Criar primeira aula
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {(aulas ?? []).map((aula, aulaIdx) => (
                <AulaItem
                  key={aula.id}
                  aula={aula}
                  index={aulaIdx}
                  isAdmin={isAdmin}
                  onOpen={() => setAulaModal({ mode: 'edit', aula })}
                />
              ))}
            </div>
          )}

          {(aulas ?? []).length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100">
              <button
                onClick={() => setAulaModal({ mode: 'create' })}
                className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Adicionar aula
              </button>
            </div>
          )}
        </div>
      )}

      {/* Aula Modal (create or edit) */}
      {aulaModal && (
        <AulaModal
          cursoId={cursoId}
          moduloId={modulo.id}
          totalAulas={aulas?.length ?? 0}
          aula={aulaModal.mode === 'edit' ? aulaModal.aula : undefined}
          onClose={() => setAulaModal(null)}
        />
      )}
    </div>
  )
}

// ========================
// AulaItem (row in module)
// ========================

function AulaItem({
  aula, index, isAdmin, onOpen,
}: {
  aula: Aula; index: number; isAdmin: boolean; onOpen: () => void
}) {
  const deleteMutation = useDeleteAula()

  const contentIcons = []
  if (aula.texto_aula) contentIcons.push({ icon: FileText, label: 'Texto', key: 'txt' })
  if (aula.pdf) contentIcons.push({ icon: FileText, label: 'PDF', key: 'pdf' })
  if (aula.imagem_capa) contentIcons.push({ icon: ImageIcon, label: 'Imagem', key: 'img' })

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 hover:bg-white transition-colors group cursor-pointer"
      onClick={onOpen}
    >
      <GripVertical
        className="h-3.5 w-3.5 text-gray-300 cursor-grab flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      />
      <span className="text-xs text-gray-400 font-mono flex-shrink-0 w-5 text-right">
        {index + 1}
      </span>

      {/* Thumbnail */}
      {aula.imagem_capa ? (
        <img src={aula.imagem_capa} alt="" className="h-10 w-14 rounded object-cover flex-shrink-0" />
      ) : (
        <div className="flex h-10 w-14 items-center justify-center rounded bg-gray-100 flex-shrink-0">
          <BookOpen className="h-4 w-4 text-gray-300" />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{aula.titulo}</p>
        {aula.descricao && (
          <p className="text-xs text-gray-500 truncate">{aula.descricao}</p>
        )}
      </div>

      {/* Content indicators */}
      <div className="flex gap-1 flex-shrink-0">
        {contentIcons.map((ci) => (
          <Tooltip key={ci.key} text={ci.label}>
            <ci.icon className="h-3.5 w-3.5 text-gray-400" />
          </Tooltip>
        ))}
      </div>

      {/* Status badges */}
      <div className="flex gap-1 flex-shrink-0">
        {aula.is_liberado && <Badge variant="success">Liberada</Badge>}
        {aula.is_degustacao && <Badge variant="info">Degustacao</Badge>}
      </div>

      {/* Delete (stop propagation so it doesn't open modal) */}
      <Tooltip text="Excluir aula">
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (confirm(`Excluir aula "${aula.titulo}"?`)) deleteMutation.mutate(aula.id)
          }}
          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </Tooltip>
    </div>
  )
}

// ========================
// AulaModal (create + edit unified)
// ========================

type AulaTab = 'geral' | 'textos' | 'audios' | 'flashcards' | 'questoes'

function AulaModal({
  cursoId, moduloId, totalAulas, aula, onClose,
}: {
  cursoId: string; moduloId: string; totalAulas: number; aula?: Aula; onClose: () => void
}) {
  const isEditing = !!aula
  const [activeTab, setActiveTab] = useState<AulaTab>('geral')

  const tabs: { key: AulaTab; label: string; icon: typeof FileText; editOnly?: boolean }[] = [
    { key: 'geral', label: 'Geral', icon: BookOpen },
    { key: 'textos', label: 'Textos', icon: FileText, editOnly: true },
    { key: 'audios', label: 'Audios', icon: Music, editOnly: true },
    { key: 'flashcards', label: 'Flashcards', icon: Layers, editOnly: true },
    { key: 'questoes', label: 'Questões', icon: HelpCircle, editOnly: true },
  ]

  const visibleTabs = isEditing ? tabs : tabs.filter((t) => !t.editOnly)

  return (
    <Modal
      open
      onClose={onClose}
      title={isEditing ? `Editar: ${aula.titulo}` : 'Nova Aula'}
      maxWidth="max-w-3xl"
    >
      {/* Tabs (only show extra tabs when editing) */}
      {visibleTabs.length > 1 && (
        <div className="flex gap-1 border-b border-gray-200 -mx-6 px-6 -mt-4 mb-4">
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'geral' && (
        <AulaGeralTab
          cursoId={cursoId}
          moduloId={moduloId}
          totalAulas={totalAulas}
          aula={aula}
          onClose={onClose}
        />
      )}
      {activeTab === 'textos' && aula && <AulaTextosTab aulaId={aula.id} />}
      {activeTab === 'audios' && aula && <AulaAudiosTab aulaId={aula.id} />}
      {activeTab === 'flashcards' && aula && <AulaFlashcardsTab aulaId={aula.id} cursoId={cursoId} />}
      {activeTab === 'questoes' && aula && <AulaQuestoesTab aulaId={aula.id} />}
    </Modal>
  )
}

// ========================
// Tab: Geral (create + edit)
// ========================

function AulaGeralTab({
  cursoId, moduloId, totalAulas, aula, onClose,
}: {
  cursoId: string; moduloId: string; totalAulas: number; aula?: Aula; onClose: () => void
}) {
  const isEditing = !!aula
  const createMutation = useCreateAula()
  const updateMutation = useUpdateAula()

  const [form, setForm] = useState({
    titulo: aula?.titulo ?? '',
    descricao: aula?.descricao ?? '',
    texto_aula: aula?.texto_aula ?? '',
    video_url: (aula as any)?.video_url ?? '',
    pdf: aula?.pdf ?? '',
    imagem_capa: aula?.imagem_capa ?? '',
    is_degustacao: aula?.is_degustacao ?? false,
    is_liberado: aula?.is_liberado ?? false,
  })
  const [error, setError] = useState('')

  function handleChange(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.titulo.trim()) { setError('Titulo e obrigatorio'); return }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: aula.id,
          titulo: form.titulo.trim(),
          descricao: form.descricao || null,
          texto_aula: form.texto_aula || null,
          video_url: form.video_url || null,
          pdf: form.pdf || null,
          imagem_capa: form.imagem_capa || null,
          is_degustacao: form.is_degustacao,
          is_liberado: form.is_liberado,
        })
      } else {
        await createMutation.mutateAsync({
          titulo: form.titulo.trim(),
          curso_id: cursoId,
          modulo_id: moduloId,
          descricao: form.descricao || null,
          sort_order: totalAulas,
        })
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Titulo *"
        value={form.titulo}
        onChange={(e) => handleChange('titulo', e.target.value)}
        placeholder="Ex: Introducao ao Direito Administrativo"
        required
        autoFocus
      />

      {/* Campos extras apenas na edicao */}
      {isEditing && (
        <>
          <FileUpload
            label="Video da Aula"
            accept="video/*"
            value={form.video_url || null}
            onChange={(url) => handleChange('video_url', url ?? '')}
            onUpload={async (file, onProgress) => {
              try {
                return await uploadFile('aulas', file, 'videos', onProgress)
              } catch (err) {
                setError(`Erro ao subir video: ${err instanceof Error ? err.message : String(err)}`)
                throw err
              }
            }}
            type="video"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FileUpload
              label="Imagem de Capa"
              accept="image/*"
              value={form.imagem_capa || null}
              onChange={(url) => handleChange('imagem_capa', url ?? '')}
              onUpload={async (file) => {
                try {
                  return await uploadFile('aulas', file, 'capas')
                } catch (err) {
                  setError(`Erro ao subir imagem: ${err instanceof Error ? err.message : String(err)}`)
                  throw err
                }
              }}
              type="image"
            />
            <FileUpload
              label="PDF da Aula"
              accept="application/pdf"
              value={form.pdf || null}
              onChange={(url) => handleChange('pdf', url ?? '')}
              onUpload={async (file) => {
                try {
                  return await uploadFile('aulas', file, 'pdfs')
                } catch (err) {
                  setError(`Erro ao subir PDF: ${err instanceof Error ? err.message : String(err)}`)
                  throw err
                }
              }}
              type="pdf"
            />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.is_liberado}
                onChange={(e) => handleChange('is_liberado', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Aula liberada
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.is_degustacao}
                onChange={(e) => handleChange('is_degustacao', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Degustacao (gratuita)
            </label>
          </div>
        </>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar aula'}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

// ========================
// Tab: Textos
// ========================

function AulaTextosTab({ aulaId }: { aulaId: string }) {
  const { data: textos, isLoading } = useTextosAula(aulaId)
  const createMutation = useCreateTextoAula()
  const updateMutation = useUpdateTextoAula()
  const deleteMutation = useDeleteTextoAula()
  const [novoTexto, setNovoTexto] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTexto, setEditingTexto] = useState('')

  async function handleAdd() {
    if (!novoTexto.trim()) return
    await createMutation.mutateAsync({ aula_id: aulaId, texto: novoTexto.trim() })
    setNovoTexto('')
  }

  async function handleSaveEdit(id: string) {
    if (!editingTexto.trim()) return
    await updateMutation.mutateAsync({ id, texto: editingTexto.trim() })
    setEditingId(null)
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      {(textos ?? []).map((t) => (
        <div key={t.id} className="rounded-lg border border-gray-200 p-3">
          {editingId === t.id ? (
            <div className="space-y-2">
              <textarea
                value={editingTexto}
                onChange={(e) => setEditingTexto(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleSaveEdit(t.id)} disabled={updateMutation.isPending}>
                  Salvar
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <p className="flex-1 text-sm text-gray-700 whitespace-pre-wrap break-all overflow-hidden">{t.texto}</p>
              <div className="flex gap-0.5 flex-shrink-0">
                <Tooltip text="Editar">
                  <button
                    onClick={() => { setEditingId(t.id); setEditingTexto(t.texto) }}
                    className="rounded p-1 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </Tooltip>
                <Tooltip text="Excluir">
                  <button
                    onClick={() => { if (confirm('Excluir este texto?')) deleteMutation.mutate(t.id) }}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </Tooltip>
              </div>
            </div>
          )}
        </div>
      ))}

      {(textos ?? []).length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">Nenhum texto adicionado</p>
      )}

      <div className="space-y-2 border-t border-gray-200 pt-4">
        <textarea
          value={novoTexto}
          onChange={(e) => setNovoTexto(e.target.value)}
          rows={3}
          placeholder="Adicionar novo bloco de texto..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <Button size="sm" onClick={handleAdd} disabled={!novoTexto.trim() || createMutation.isPending}>
          <Plus className="mr-1 h-4 w-4" />
          {createMutation.isPending ? 'Adicionando...' : 'Adicionar texto'}
        </Button>
      </div>
    </div>
  )
}

// ========================
// Tab: Audios
// ========================

function AulaAudiosTab({ aulaId }: { aulaId: string }) {
  const { data: audios, isLoading } = useAudiosAula(aulaId)
  const createMutation = useCreateAudioAula()
  const deleteMutation = useDeleteAudioAula()
  const [titulo, setTitulo] = useState('')
  const [uploading, setUploading] = useState(false)
  const [audioUrl, setAudioUrl] = useState('')

  async function handleUploadAudio(file: File) {
    setUploading(true)
    try {
      const url = await uploadFile('aulas', file, 'audios')
      setAudioUrl(url)
    } catch {
      // handled
    } finally {
      setUploading(false)
    }
  }

  async function handleAdd() {
    if (!audioUrl) return
    await createMutation.mutateAsync({
      aula_id: aulaId,
      titulo: titulo.trim() || null,
      audio_url: audioUrl,
    })
    setTitulo('')
    setAudioUrl('')
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      {(audios ?? []).map((a) => (
        <div key={a.id} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
          <Music className="h-5 w-5 text-purple-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800">{a.titulo || 'Audio sem titulo'}</p>
            <audio src={a.audio_url} controls preload="metadata" className="mt-1 w-full h-8" />
          </div>
          <Tooltip text="Excluir audio">
            <button
              onClick={() => { if (confirm('Excluir este audio?')) deleteMutation.mutate(a.id) }}
              className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 flex-shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>
      ))}

      {(audios ?? []).length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">Nenhum audio adicionado</p>
      )}

      <div className="space-y-3 border-t border-gray-200 pt-4">
        <Input
          label="Titulo do audio (opcional)"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ex: Resumo em audio"
        />

        {audioUrl ? (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
            <Music className="h-5 w-5 text-green-600" />
            <audio src={audioUrl} controls preload="metadata" className="flex-1 h-8" />
            <button onClick={() => setAudioUrl('')} className="rounded p-1 text-gray-400 hover:text-red-500">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-4 text-sm text-gray-500 hover:border-purple-400 hover:bg-purple-50 hover:text-purple-600">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Upload className="h-6 w-6" />
            )}
            <span>{uploading ? 'Enviando...' : 'Clique para enviar audio'}</span>
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUploadAudio(file)
                e.target.value = ''
              }}
            />
          </label>
        )}

        <Button size="sm" onClick={handleAdd} disabled={!audioUrl || createMutation.isPending}>
          <Plus className="mr-1 h-4 w-4" />
          {createMutation.isPending ? 'Adicionando...' : 'Adicionar audio'}
        </Button>
      </div>
    </div>
  )
}

// ========================
// Tab: Flashcards
// ========================

function AulaFlashcardsTab({ aulaId, cursoId }: { aulaId: string; cursoId: string }) {
  const { data: curso } = useCurso(cursoId)
  const { data: flashcards, isLoading } = useFlashcardsAula(aulaId)
  const createMutation = useCreateFlashcardAula()
  const updateMutation = useUpdateFlashcardAula()
  const deleteMutation = useDeleteFlashcardAula()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pergunta, setPergunta] = useState('')
  const [resposta, setResposta] = useState('')

  function openEdit(fc: { id: string; pergunta: string; resposta: string }) {
    setEditingId(fc.id)
    setPergunta(fc.pergunta)
    setResposta(fc.resposta)
    setShowForm(true)
  }

  function openNew() {
    setEditingId(null)
    setPergunta('')
    setResposta('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setPergunta('')
    setResposta('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!pergunta.trim() || !resposta.trim()) return

    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, pergunta: pergunta.trim(), resposta: resposta.trim() })
    } else {
      if (!curso?.professor_id) return
      await createMutation.mutateAsync({
        aula_id: aulaId,
        curso_id: cursoId,
        professor_id: curso.professor_id,
        pergunta: pergunta.trim(),
        resposta: resposta.trim(),
      })
    }
    closeForm()
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      {(flashcards ?? []).map((fc, idx) => (
        <div key={fc.id} className="rounded-lg border border-gray-200 p-4 space-y-2">
          <div className="flex items-start gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700 flex-shrink-0">
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{fc.pergunta}</p>
              <p className="text-sm text-gray-600 mt-1 bg-gray-50 rounded px-3 py-2">{fc.resposta}</p>
            </div>
            <div className="flex gap-0.5 flex-shrink-0">
              <Tooltip text="Editar">
                <button
                  onClick={() => openEdit(fc)}
                  className="rounded p-1 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </Tooltip>
              <Tooltip text="Excluir">
                <button
                  onClick={() => { if (confirm('Excluir este flashcard?')) deleteMutation.mutate(fc.id) }}
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      ))}

      {(flashcards ?? []).length === 0 && !showForm && (
        <p className="text-sm text-gray-400 text-center py-4">Nenhum flashcard adicionado</p>
      )}

      {showForm ? (
        <form onSubmit={handleSubmit} className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Pergunta (frente)</label>
            <textarea
              value={pergunta}
              onChange={(e) => setPergunta(e.target.value)}
              rows={2}
              required
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Ex: O que é mandado de segurança?"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Resposta (verso)</label>
            <textarea
              value={resposta}
              onChange={(e) => setResposta(e.target.value)}
              rows={3}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Ex: É uma ação constitucional que..."
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? 'Salvando...' : editingId ? 'Salvar' : 'Adicionar'}
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={closeForm}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <Button size="sm" onClick={openNew}>
          <Plus className="mr-1 h-4 w-4" />
          Novo flashcard
        </Button>
      )}
    </div>
  )
}

// ========================
// Tab: Questoes
// ========================

function AulaQuestoesTab({ aulaId }: { aulaId: string }) {
  const { data: questoes, isLoading } = useQuestoesAula(aulaId)
  const deleteMutation = useDeleteQuestaoAula()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      {(questoes ?? []).map((q, idx) => (
        <div key={q.id} className="rounded-lg border border-gray-200 p-4 space-y-2">
          {editingId === q.id ? (
            <QuestaoForm
              aulaId={aulaId}
              existing={q}
              sortOrder={idx}
              onClose={() => setEditingId(null)}
            />
          ) : (
            <>
              <div className="flex items-start gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 flex-shrink-0">
                  {idx + 1}
                </span>
                <p className="flex-1 text-sm font-medium text-gray-800 break-all">{q.pergunta}</p>
                <div className="flex gap-0.5 flex-shrink-0">
                  <Tooltip text="Editar">
                    <button
                      onClick={() => setEditingId(q.id)}
                      className="rounded p-1 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </Tooltip>
                  <Tooltip text="Excluir">
                    <button
                      onClick={() => { if (confirm('Excluir esta questao?')) deleteMutation.mutate(q.id) }}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </Tooltip>
                </div>
              </div>
              <div className="ml-8 space-y-1">
                {q.alternativas.map((alt, altIdx) => {
                  const isCorreta = q.resposta && q.alternativas.indexOf(q.resposta) === altIdx
                  return (
                    <div
                      key={altIdx}
                      className={`flex items-center gap-2 rounded px-2 py-1 text-sm ${
                        isCorreta
                          ? 'bg-green-50 text-green-700 font-medium'
                          : 'text-gray-600'
                      }`}
                    >
                      <span className="text-xs font-bold flex-shrink-0">{String.fromCharCode(65 + altIdx)})</span>
                      <span className="break-all">{alt}</span>
                      {isCorreta && <Badge variant="success">Correta</Badge>}
                    </div>
                  )
                })}
              </div>
              {q.video && (
                <p className="ml-8 text-xs text-gray-500">Video: {q.video}</p>
              )}
            </>
          )}
        </div>
      ))}

      {(questoes ?? []).length === 0 && !showForm && (
        <p className="text-sm text-gray-400 text-center py-4">Nenhuma questao adicionada</p>
      )}

      {showForm ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <QuestaoForm
            aulaId={aulaId}
            sortOrder={(questoes ?? []).length}
            onClose={() => setShowForm(false)}
          />
        </div>
      ) : (
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Nova questao
        </Button>
      )}
    </div>
  )
}

// ========================
// QuestaoForm
// ========================

function QuestaoForm({
  aulaId, existing, sortOrder, onClose,
}: {
  aulaId: string; existing?: QuestaoAula; sortOrder: number; onClose: () => void
}) {
  const createMutation = useCreateQuestaoAula()
  const updateMutation = useUpdateQuestaoAula()
  const [pergunta, setPergunta] = useState(existing?.pergunta ?? '')
  const [alternativas, setAlternativas] = useState<string[]>(
    existing?.alternativas ?? ['', '', '', ''],
  )
  // Track correct answer by INDEX, not by text value
  const [respostaIdx, setRespostaIdx] = useState<number | null>(() => {
    if (!existing?.resposta || !existing?.alternativas) return null
    const idx = existing.alternativas.indexOf(existing.resposta)
    return idx >= 0 ? idx : null
  })
  const [video, setVideo] = useState(existing?.video ?? '')
  const [respostaEscrita, setRespostaEscrita] = useState(existing?.resposta_escrita ?? '')
  const [error, setError] = useState('')

  function handleAlternativaChange(idx: number, value: string) {
    setAlternativas((prev) => prev.map((a, i) => (i === idx ? value : a)))
  }

  function addAlternativa() {
    if (alternativas.length < 6) setAlternativas((prev) => [...prev, ''])
  }

  function removeAlternativa(idx: number) {
    if (alternativas.length <= 2) return
    setAlternativas((prev) => prev.filter((_, i) => i !== idx))
    // Adjust respostaIdx when removing alternatives
    if (respostaIdx === idx) {
      setRespostaIdx(null)
    } else if (respostaIdx !== null && respostaIdx > idx) {
      setRespostaIdx(respostaIdx - 1)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const filledAlts = alternativas.filter((a) => a.trim())
    if (!pergunta.trim()) { setError('Pergunta e obrigatoria'); return }
    if (filledAlts.length < 2) { setError('Minimo 2 alternativas'); return }
    if (respostaIdx === null || !alternativas[respostaIdx]?.trim()) {
      setError('Selecione a resposta correta'); return
    }

    try {
      const data = {
        pergunta: pergunta.trim(),
        alternativas: filledAlts,
        resposta: alternativas[respostaIdx].trim(),
        video: video.trim() || null,
        resposta_escrita: respostaEscrita.trim() || null,
      }

      if (existing) {
        await updateMutation.mutateAsync({ id: existing.id, ...data })
      } else {
        await createMutation.mutateAsync({ aula_id: aulaId, sort_order: sortOrder, ...data })
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro')
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Pergunta *</label>
        <textarea
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          rows={2}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Digite a pergunta..."
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Alternativas * (marque a correta)</label>
        {alternativas.map((alt, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <input
              type="radio"
              name="resposta"
              checked={respostaIdx === idx}
              onChange={() => setRespostaIdx(idx)}
              disabled={!alt.trim()}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 mt-2"
              title="Marcar como correta"
            />
            <span className="text-sm text-gray-500 w-5 mt-2">{String.fromCharCode(65 + idx)})</span>
            <textarea
              value={alt}
              onChange={(e) => handleAlternativaChange(idx, e.target.value)}
              placeholder={`Alternativa ${String.fromCharCode(65 + idx)}`}
              rows={2}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {alternativas.length > 2 && (
              <button type="button" onClick={() => removeAlternativa(idx)} className="text-gray-400 hover:text-red-500 mt-2">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        {alternativas.length < 6 && (
          <button type="button" onClick={addAlternativa} className="text-sm text-blue-600 hover:text-blue-700">
            + Adicionar alternativa
          </button>
        )}
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
        <Input
          placeholder="URL do vídeo (YouTube, Vimeo, etc.)"
          value={video}
          onChange={(e) => setVideo(e.target.value)}
        />
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
          onUpload={(file, onProgress) => uploadFile('aulas', file, 'videos-questoes', onProgress)}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? 'Salvando...' : existing ? 'Salvar' : 'Adicionar'}
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

// ========================
// Shared
// ========================

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-6">
      <div className="h-6 w-6 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
    </div>
  )
}
