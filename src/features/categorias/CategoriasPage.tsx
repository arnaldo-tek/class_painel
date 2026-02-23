import { useState, type FormEvent } from 'react'
import { Tags, Plus, Pencil, Trash2, X } from 'lucide-react'
import {
  useCategorias, useCreateCategoria, useUpdateCategoria, useDeleteCategoria,
} from './hooks'
import { TIPOS_CATEGORIA, type Categoria } from './api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'

export function CategoriasPage() {
  const [tipoFilter, setTipoFilter] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const { data, isLoading } = useCategorias(tipoFilter || undefined)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
        <Button onClick={() => { setShowForm(true); setEditingId(null) }}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      <div className="flex gap-3">
        <Select
          placeholder="Todos os tipos"
          options={TIPOS_CATEGORIA.map((t) => ({ value: t.value, label: t.label }))}
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value)}
        />
      </div>

      {showForm && (
        <CategoriaForm
          editingId={editingId}
          onClose={() => { setShowForm(false); setEditingId(null) }}
        />
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : !data?.categorias.length ? (
        <EmptyState
          icon={<Tags className="h-12 w-12" />}
          title="Nenhuma categoria encontrada"
          description="Crie a primeira categoria para organizar o conteúdo."
        />
      ) : (
        <div className="space-y-2">
          {data.categorias.map((cat) => (
            <CategoriaItem
              key={cat.id}
              categoria={cat}
              onEdit={() => { setEditingId(cat.id); setShowForm(true) }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const FILTROS_CONFIG = [
  { key: 'filtro_estado', label: 'Estados' },
  { key: 'filtro_cidade', label: 'Cidades' },
  { key: 'filtro_esfera', label: 'Esfera' },
  { key: 'filtro_orgao', label: 'Órgãos (catálogo)' },
  { key: 'filtro_orgao_editais_noticias', label: 'Órgãos (editais/notícias)' },
  { key: 'filtro_escolaridade', label: 'Escolaridade' },
  { key: 'filtro_nivel', label: 'Nível' },
  { key: 'filtro_cargo', label: 'Cargos' },
  { key: 'filtro_disciplina', label: 'Disciplinas' },
] as const

type FiltroKey = (typeof FILTROS_CONFIG)[number]['key']

function CategoriaForm({ editingId, onClose }: { editingId: string | null; onClose: () => void }) {
  const { data: existing } = useCategorias()
  const existingCat = existing?.categorias.find((c) => c.id === editingId)

  const [nome, setNome] = useState(existingCat?.nome ?? '')
  const [tipo, setTipo] = useState(existingCat?.tipo ?? 'curso')
  const [filtros, setFiltros] = useState<Record<FiltroKey, boolean>>(() => {
    const defaults = {} as Record<FiltroKey, boolean>
    for (const f of FILTROS_CONFIG) {
      defaults[f.key] = existingCat?.[f.key] === true
    }
    return defaults
  })
  const [error, setError] = useState('')

  const createMutation = useCreateCategoria()
  const updateMutation = useUpdateCategoria()

  function toggleFiltro(key: FiltroKey) {
    setFiltros((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) { setError('Nome é obrigatório'); return }
    setError('')

    const payload = { nome: nome.trim(), tipo, ...filtros }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...payload })
      } else {
        await createMutation.mutateAsync(payload as any)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">
          {editingId ? 'Editar Categoria' : 'Nova Categoria'}
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Nome da categoria"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>
          <Select
            options={TIPOS_CATEGORIA.map((t) => ({ value: t.value, label: t.label }))}
            value={tipo}
            onChange={(e) => setTipo(e.target.value as typeof tipo)}
          />
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Filtros disponíveis:</p>
          <div className="grid grid-cols-2 gap-2">
            {FILTROS_CONFIG.map((f) => (
              <label key={f.key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtros[f.key]}
                  onChange={() => toggleFiltro(f.key)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                {f.label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSaving} size="sm">
            {isSaving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar'}
          </Button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </form>
    </div>
  )
}

function CategoriaItem({
  categoria, onEdit,
}: {
  categoria: Categoria; onEdit: () => void
}) {
  const deleteMutation = useDeleteCategoria()

  function handleDelete() {
    if (confirm(`Excluir categoria "${categoria.nome}"?`)) {
      deleteMutation.mutate(categoria.id)
    }
  }

  const tipoBadge: Record<string, 'info' | 'success' | 'warning' | 'default'> = {
    curso: 'info', noticia: 'success', edital: 'warning', pacote: 'default',
  }

  const filtrosAtivos = FILTROS_CONFIG.filter((f) => categoria[f.key] === true)

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 space-y-2">
      <div className="flex items-center gap-3">
        <span className="flex-1 font-medium text-gray-900">{categoria.nome}</span>
        <Badge variant={tipoBadge[categoria.tipo] ?? 'default'}>{categoria.tipo}</Badge>
        <button onClick={onEdit} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <Pencil className="h-4 w-4" />
        </button>
        <button onClick={handleDelete} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {filtrosAtivos.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {filtrosAtivos.map((f) => (
            <Badge key={f.key} variant="default">{f.label}</Badge>
          ))}
        </div>
      )}
    </div>
  )
}
