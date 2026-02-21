import { useState, type FormEvent } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft, Plus, GripVertical, Pencil, Trash2, X,
  ChevronDown, ChevronRight, FileText, Video, Music, HelpCircle,
} from 'lucide-react'
import { useCurso } from './hooks'
import {
  useModulos, useCreateModulo, useUpdateModulo, useDeleteModulo,
  useAulas, useCreateAula, useUpdateAula, useDeleteAula,
} from './modulos-hooks'
import type { Modulo, Aula } from './modulos-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'

export function CursoDetailPage() {
  const { cursoId } = useParams({ strict: false }) as { cursoId: string }
  const navigate = useNavigate()
  const { data: curso, isLoading: loadingCurso } = useCurso(cursoId)
  const { data: modulos, isLoading: loadingModulos } = useModulos(cursoId)
  const { data: aulaSemModulo } = useAulas(cursoId)

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
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{curso.nome}</h1>
          <p className="text-sm text-gray-500">Módulos e Aulas</p>
        </div>
        <Button onClick={() => navigate({ to: '/cursos/$cursoId/editar', params: { cursoId } })}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar Curso
        </Button>
      </div>

      {/* Módulos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Módulos ({modulos?.length ?? 0})
          </h2>
          <Button size="sm" onClick={() => { setShowModuloForm(true); setEditingModuloId(null) }}>
            <Plus className="mr-1 h-4 w-4" />
            Novo Módulo
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
          <p className="text-gray-400">Carregando...</p>
        ) : !modulos?.length ? (
          <EmptyState
            title="Nenhum módulo"
            description="Crie módulos para organizar as aulas do curso."
          />
        ) : (
          <div className="space-y-2">
            {modulos.map((modulo) => (
              <ModuloCard
                key={modulo.id}
                modulo={modulo}
                cursoId={cursoId}
                onEdit={() => { setEditingModuloId(modulo.id); setShowModuloForm(true) }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// === Modulo Form ===

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
    if (!nome.trim()) { setError('Nome é obrigatório'); return }
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
            placeholder="Nome do módulo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
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

// === Modulo Card ===

function ModuloCard({
  modulo, cursoId, onEdit,
}: {
  modulo: Modulo; cursoId: string; onEdit: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [showAulaForm, setShowAulaForm] = useState(false)
  const deleteMutation = useDeleteModulo()
  const { data: aulas } = useAulas(cursoId, modulo.id)

  function handleDelete() {
    if (confirm(`Excluir módulo "${modulo.nome}" e todas as suas aulas?`)) {
      deleteMutation.mutate(modulo.id)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center gap-2 px-4 py-3">
        <GripVertical className="h-4 w-4 text-gray-300 cursor-grab" />
        <button onClick={() => setExpanded(!expanded)} className="text-gray-400">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <span className="flex-1 font-medium text-gray-900">{modulo.nome}</span>
        <Badge variant="default">{aulas?.length ?? 0} aulas</Badge>
        <button onClick={onEdit} className="rounded p-1.5 text-gray-400 hover:bg-gray-100">
          <Pencil className="h-4 w-4" />
        </button>
        <button onClick={handleDelete} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 pl-12 space-y-2">
          {(aulas ?? []).map((aula) => (
            <AulaItem key={aula.id} aula={aula} />
          ))}

          {showAulaForm ? (
            <AulaForm
              cursoId={cursoId}
              moduloId={modulo.id}
              totalAulas={aulas?.length ?? 0}
              onClose={() => setShowAulaForm(false)}
            />
          ) : (
            <button
              onClick={() => setShowAulaForm(true)}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar aula
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// === Aula Item ===

function AulaItem({ aula }: { aula: Aula }) {
  const deleteMutation = useDeleteAula()

  const icons = []
  if (aula.texto_aula) icons.push(<FileText key="t" className="h-3.5 w-3.5" />)
  if (aula.imagem_capa) icons.push(<Video key="v" className="h-3.5 w-3.5" />)
  if (aula.pdf) icons.push(<FileText key="p" className="h-3.5 w-3.5" />)

  return (
    <div className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-50">
      <GripVertical className="h-3.5 w-3.5 text-gray-300 cursor-grab" />
      <span className="flex-1 text-sm text-gray-700">{aula.titulo}</span>
      <div className="flex gap-1 text-gray-400">{icons}</div>
      {aula.is_liberado && <Badge variant="success">Liberada</Badge>}
      {aula.is_degustacao && <Badge variant="info">Degustação</Badge>}
      <button
        onClick={() => {
          if (confirm(`Excluir aula "${aula.titulo}"?`)) deleteMutation.mutate(aula.id)
        }}
        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// === Aula Form ===

function AulaForm({
  cursoId, moduloId, totalAulas, onClose,
}: {
  cursoId: string; moduloId: string; totalAulas: number; onClose: () => void
}) {
  const [titulo, setTitulo] = useState('')
  const [error, setError] = useState('')
  const createMutation = useCreateAula()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) { setError('Título é obrigatório'); return }
    try {
      await createMutation.mutateAsync({
        titulo: titulo.trim(),
        curso_id: cursoId,
        modulo_id: moduloId,
        sort_order: totalAulas,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
      <div className="flex-1">
        <Input
          placeholder="Título da aula"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
        />
      </div>
      <Button type="submit" size="sm" disabled={createMutation.isPending}>
        Adicionar
      </Button>
      <Button type="button" size="sm" variant="secondary" onClick={onClose}>
        Cancelar
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  )
}
