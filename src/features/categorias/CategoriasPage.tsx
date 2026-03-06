import { useState, type FormEvent } from 'react'
import { Tags, Plus, Pencil, Trash2, X } from 'lucide-react'
import {
  useCategorias, useCreateCategoria, useUpdateCategoria, useDeleteCategoria,
} from './hooks'
import { TIPOS_CATEGORIA, type Categoria } from './api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'

const TABS = [
  { value: 'curso', label: 'Cursos', color: 'text-blue-600 border-blue-600', bg: 'bg-blue-50' },
  { value: 'noticia', label: 'Notícias', color: 'text-emerald-600 border-emerald-600', bg: 'bg-emerald-50' },
  { value: 'edital', label: 'Editais', color: 'text-amber-600 border-amber-600', bg: 'bg-amber-50' },
] as const

export function CategoriasPage() {
  const [activeTab, setActiveTab] = useState<string>('curso')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const { data, isLoading } = useCategorias(activeTab)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
        <Button onClick={() => { setShowForm(true); setEditingId(null) }}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-0 -mb-px">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setActiveTab(tab.value); setShowForm(false); setEditingId(null) }}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.value
                  ? tab.color
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {showForm && (
        <CategoriaForm
          editingId={editingId}
          fixedTipo={activeTab}
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
          description={`Crie a primeira categoria de ${TABS.find((t) => t.value === activeTab)?.label.toLowerCase() ?? 'conteúdo'}.`}
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

function CategoriaForm({ editingId, fixedTipo, onClose }: { editingId: string | null; fixedTipo: string; onClose: () => void }) {
  const { data: existing } = useCategorias()
  const existingCat = existing?.categorias.find((c) => c.id === editingId)

  const [nome, setNome] = useState(existingCat?.nome ?? '')
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

    const payload = { nome: nome.trim(), tipo: fixedTipo, ...filtros }

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
  const tabInfo = TABS.find((t) => t.value === fixedTipo)

  return (
    <div className={`rounded-lg border border-gray-200 p-4 ${tabInfo?.bg ?? 'bg-blue-50'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">
          {editingId ? 'Editar Categoria' : `Nova Categoria de ${tabInfo?.label ?? ''}`}
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex-1">
          <Input
            placeholder="Nome da categoria"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Filtros disponíveis:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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

  const filtrosAtivos = FILTROS_CONFIG.filter((f) => categoria[f.key] === true)

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 space-y-2">
      <div className="flex items-center gap-3">
        <span className="flex-1 font-medium text-gray-900">{categoria.nome}</span>
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
