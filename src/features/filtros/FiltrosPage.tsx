import { useState } from 'react'
import { SlidersHorizontal, Plus, Pencil, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, type SelectOptionGroup } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { Pagination } from '@/components/ui/pagination'
import { useCategorias } from '@/features/categorias/hooks'
import {
  useEstados, useMunicipios, useMunicipiosByEstado,
  useEsferas, useCreateEsfera, useUpdateEsfera, useDeleteEsfera,
  useEscolaridades, useCreateEscolaridade, useUpdateEscolaridade, useDeleteEscolaridade,
  useNiveis, useCreateNivel, useUpdateNivel, useDeleteNivel,
  useOrgaos, useCreateOrgao, useUpdateOrgao, useDeleteOrgao,
  useCargos, useCreateCargo, useUpdateCargo, useDeleteCargo,
  useDisciplinas, useCreateDisciplina, useUpdateDisciplina, useDeleteDisciplina,
} from './hooks'
import type { Orgao, Cargo, Disciplina } from './api'

const TABS = [
  { key: 'estados', label: 'Estados' },
  { key: 'municipios', label: 'Municipios' },
  { key: 'escolaridades', label: 'Escolaridades' },
  { key: 'niveis', label: 'Niveis' },
  { key: 'esferas', label: 'Esferas' },
  { key: 'orgaos', label: 'Orgaos' },
  { key: 'cargos', label: 'Cargos' },
  { key: 'disciplinas', label: 'Disciplinas' },
] as const

type TabKey = (typeof TABS)[number]['key']

export function FiltrosPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('estados')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Filtros</h1>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'estados' && <EstadosPanel />}
      {activeTab === 'municipios' && <MunicipiosPanel />}
      {activeTab === 'esferas' && (
        <SimpleCrudPanel label="Esfera" useList={useEsferas} useCreate={useCreateEsfera} useUpdate={useUpdateEsfera} useDelete={useDeleteEsfera} />
      )}
      {activeTab === 'escolaridades' && (
        <SimpleCrudPanel label="Escolaridade" useList={useEscolaridades} useCreate={useCreateEscolaridade} useUpdate={useUpdateEscolaridade} useDelete={useDeleteEscolaridade} />
      )}
      {activeTab === 'niveis' && (
        <SimpleCrudPanel label="Nivel" useList={useNiveis} useCreate={useCreateNivel} useUpdate={useUpdateNivel} useDelete={useDeleteNivel} />
      )}
      {activeTab === 'orgaos' && <OrgaosPanel />}
      {activeTab === 'cargos' && <CargosPanel />}
      {activeTab === 'disciplinas' && <DisciplinasPanel />}
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────

function Loading() {
  return (
    <div className="flex justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  )
}

function ExtraFields({ fields }: { fields: { label: string; value: string | null }[] }) {
  const filled = fields.filter((f) => f.value)
  if (!filled.length) return null
  return (
    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
      {filled.map((f) => (
        <span key={f.label}>{f.label}: {f.value}</span>
      ))}
    </div>
  )
}

function idOptions(items: { id: string; nome: string }[]) {
  return items.map((i) => ({ value: i.id, label: i.nome }))
}

const TIPO_LABELS: Record<string, string> = {
  curso: 'Cursos',
  noticia: 'Notícias',
  edital: 'Editais',
  pacote: 'Pacotes',
}

function categoriaGroups(categorias: { id: string; nome: string; tipo: string }[]): SelectOptionGroup[] {
  const grouped = new Map<string, { value: string; label: string }[]>()
  for (const c of categorias) {
    const key = c.tipo
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push({ value: c.id, label: c.nome })
  }
  return Array.from(grouped.entries()).map(([tipo, options]) => ({
    label: TIPO_LABELS[tipo] ?? tipo,
    options,
  }))
}

// ─── Estados (somente leitura) ──────────────────────────────────────

function EstadosPanel() {
  const { data, isLoading } = useEstados()

  if (isLoading) return <Loading />
  if (!data?.items.length) {
    return <EmptyState icon={<SlidersHorizontal className="h-12 w-12" />} title="Nenhum estado encontrado" />
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-500">{data.total} estados</p>
      {data.items.map((item) => (
        <div key={item.id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
          {item.imagem && <img src={item.imagem} alt={item.nome} className="h-8 w-8 rounded object-cover" />}
          <span className="font-medium text-gray-900">{item.nome}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Municípios (somente leitura, filtro por estado + paginação) ────

function MunicipiosPanel() {
  const [filterEstadoId, setFilterEstadoId] = useState('')
  const [page, setPage] = useState(1)

  const { data: estadosData } = useEstados()
  const { data, isLoading } = useMunicipios(filterEstadoId || undefined, page)

  const estadoOptions = idOptions(estadosData?.items ?? [])
  const totalPages = Math.ceil((data?.total ?? 0) / 50)

  return (
    <div className="space-y-4">
      <Select
        placeholder="Filtrar por estado"
        options={estadoOptions}
        value={filterEstadoId}
        onChange={(e) => { setFilterEstadoId(e.target.value); setPage(1) }}
      />
      {isLoading ? <Loading /> : !data?.items.length ? (
        <EmptyState icon={<SlidersHorizontal className="h-12 w-12" />} title="Nenhum municipio encontrado" description={filterEstadoId ? 'Tente selecionar outro estado.' : undefined} />
      ) : (
        <>
          <p className="text-sm text-gray-500">{data.total} municipios</p>
          <div className="space-y-2">
            {data.items.map((item) => (
              <div key={item.id} className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                <span className="font-medium text-gray-900">{item.nome}</span>
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}

// ─── Simple CRUD (nome only): esferas, escolaridades, níveis ────────

interface SimpleCrudPanelProps {
  label: string
  useList: () => { data?: { items: { id: string; nome: string }[]; total: number }; isLoading: boolean }
  useCreate: () => { mutateAsync: (data: { nome: string }) => Promise<unknown>; isPending: boolean }
  useUpdate: () => { mutateAsync: (data: { id: string; nome: string }) => Promise<unknown>; isPending: boolean }
  useDelete: () => { mutate: (id: string) => void }
}

function SimpleCrudPanel({ label, useList, useCreate, useUpdate, useDelete }: SimpleCrudPanelProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [error, setError] = useState('')

  const { data, isLoading } = useList()
  const createMut = useCreate()
  const updateMut = useUpdate()
  const deleteMut = useDelete()

  function openCreate() { setEditingId(null); setNome(''); setError(''); setShowForm(true) }
  function openEdit(item: { id: string; nome: string }) { setEditingId(item.id); setNome(item.nome); setError(''); setShowForm(true) }
  function closeForm() { setShowForm(false); setEditingId(null); setNome(''); setError('') }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) { setError('Nome e obrigatorio'); return }
    setError('')
    try {
      if (editingId) { await updateMut.mutateAsync({ id: editingId, nome: nome.trim() }) }
      else { await createMut.mutateAsync({ nome: nome.trim() }) }
      closeForm()
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro ao salvar') }
  }

  function handleDelete(item: { id: string; nome: string }) {
    if (confirm(`Excluir "${item.nome}"?`)) deleteMut.mutate(item.id)
  }

  const isSaving = createMut.isPending || updateMut.isPending

  return (
    <div className="space-y-4">
      <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Novo {label}</Button>

      {showForm && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">{editingId ? `Editar ${label}` : `Novo ${label}`}</h3>
            <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <Input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <Button type="submit" disabled={isSaving} size="sm">{isSaving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar'}</Button>
            {error && <p className="text-sm text-red-600 w-full">{error}</p>}
          </form>
        </div>
      )}

      {isLoading ? <Loading /> : !data?.items.length ? (
        <EmptyState icon={<SlidersHorizontal className="h-12 w-12" />} title={`Nenhum ${label.toLowerCase()} encontrado`} />
      ) : (
        <div className="space-y-2">
          {data.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
              <span className="flex-1 font-medium text-gray-900">{item.nome}</span>
              <button onClick={() => openEdit(item)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => handleDelete(item)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Órgãos Panel ───────────────────────────────────────────────────
// Categoria → Esfera → Estado (se Estadual/Municipal) → Cidade (se Municipal) → Nome

function OrgaosPanel() {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [esferaId, setEsferaId] = useState('')
  const [estadoId, setEstadoId] = useState('')
  const [municipioId, setMunicipioId] = useState('')
  const [escolaridadeId, setEscolaridadeId] = useState('')
  const [filterCategoriaId, setFilterCategoriaId] = useState('')
  const [error, setError] = useState('')

  const { data: categoriasData } = useCategorias()
  const { data: esferasData } = useEsferas()
  const { data: estadosData } = useEstados()
  const { data: cidadesData } = useMunicipiosByEstado(estadoId || undefined)
  const { data: escolaridadesData } = useEscolaridades()
  const { data, isLoading } = useOrgaos()
  const createMut = useCreateOrgao()
  const updateMut = useUpdateOrgao()
  const deleteMut = useDeleteOrgao()

  const allCategorias = (categoriasData?.categorias ?? []) as { id: string; nome: string; tipo: string }[]
  const categoriaOpts = idOptions(allCategorias)
  const categoriaGrps = categoriaGroups(allCategorias)
  const esferaOpts = idOptions(esferasData?.items ?? [])
  const estadoOpts = idOptions(estadosData?.items ?? [])
  const cidadeOpts = idOptions(cidadesData ?? [])
  const escolaridadeOpts = idOptions(escolaridadesData?.items ?? [])

  // Resolve esfera nome para controlar cascata
  const esferaNome = esferasData?.items.find((e) => e.id === esferaId)?.nome ?? ''
  const showEstado = esferaNome === 'Estadual' || esferaNome === 'Municipal'
  const showCidade = esferaNome === 'Municipal' && !!estadoId

  // Filter displayed orgãos by category
  const filteredItems = (data?.items ?? []).filter((item) => {
    if (!filterCategoriaId) return true
    return item.categoria_id === filterCategoriaId
  })

  function handleEsferaChange(value: string) {
    setEsferaId(value)
    const nome = esferasData?.items.find((e) => e.id === value)?.nome ?? ''
    if (nome !== 'Estadual' && nome !== 'Municipal') { setEstadoId(''); setMunicipioId('') }
    if (nome !== 'Municipal') { setMunicipioId('') }
  }

  function handleEstadoChange(value: string) {
    setEstadoId(value)
    setMunicipioId('')
  }

  function openCreate() {
    setEditingId(null); setNome(''); setCategoriaId(''); setEsferaId(''); setEstadoId(''); setMunicipioId(''); setEscolaridadeId(''); setError(''); setShowForm(true)
  }

  function openEdit(item: Orgao) {
    setEditingId(item.id); setNome(item.nome); setCategoriaId(item.categoria_id ?? ''); setEsferaId(item.esfera_id ?? '')
    setEstadoId(item.estado_id ?? ''); setMunicipioId(item.municipio_id ?? ''); setEscolaridadeId(item.escolaridade_id ?? ''); setError(''); setShowForm(true)
  }

  function closeForm() { setShowForm(false); setEditingId(null); setError('') }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) { setError('Nome e obrigatorio'); return }
    setError('')
    const payload = {
      nome: nome.trim(),
      categoria_id: categoriaId || null,
      esfera_id: esferaId || null,
      estado_id: showEstado ? (estadoId || null) : null,
      municipio_id: showCidade ? (municipioId || null) : null,
      escolaridade_id: escolaridadeId || null,
    }
    try {
      if (editingId) { await updateMut.mutateAsync({ id: editingId, ...payload }) }
      else { await createMut.mutateAsync(payload) }
      closeForm()
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro ao salvar') }
  }

  function handleDelete(item: Orgao) {
    if (confirm(`Excluir orgao "${item.nome}"?`)) deleteMut.mutate(item.id)
  }

  const isSaving = createMut.isPending || updateMut.isPending

  return (
    <div className="space-y-4">
      <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Novo Orgao</Button>

      {showForm && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">{editingId ? 'Editar Orgao' : 'Novo Orgao'}</h3>
            <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select label="Categoria" placeholder="Selecione a categoria" options={[]} groups={categoriaGrps} value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} />
              <Select label="Esfera" placeholder="Selecione a esfera" options={esferaOpts} value={esferaId} onChange={(e) => handleEsferaChange(e.target.value)} />
              {showEstado && (
                <Select label="Estado" placeholder="Selecione o estado" options={estadoOpts} value={estadoId} onChange={(e) => handleEstadoChange(e.target.value)} />
              )}
              {showCidade && (
                <Select label="Cidade" placeholder="Selecione a cidade" options={cidadeOpts} value={municipioId} onChange={(e) => setMunicipioId(e.target.value)} />
              )}
              <Select label="Escolaridade" placeholder="Selecione" options={escolaridadeOpts} value={escolaridadeId} onChange={(e) => setEscolaridadeId(e.target.value)} />
              <Input label="Nome" placeholder="Nome do orgao" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isSaving} size="sm">{isSaving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar'}</Button>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          </form>
        </div>
      )}

      {/* Filter by category */}
      <div className="max-w-xs">
        <Select
          label="Filtrar por categoria"
          placeholder="Todas as categorias"
          options={[]}
          groups={categoriaGrps}
          value={filterCategoriaId}
          onChange={(e) => setFilterCategoriaId(e.target.value)}
        />
      </div>

      {isLoading ? <Loading /> : !filteredItems.length ? (
        <EmptyState icon={<SlidersHorizontal className="h-12 w-12" />} title="Nenhum orgao encontrado" />
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">{filteredItems.length} orgaos{filterCategoriaId ? ' nesta categoria' : ''}</p>
          {filteredItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
              <div className="flex-1">
                <span className="font-medium text-gray-900">{item.nome}</span>
                <ExtraFields fields={[
                  { label: 'Categoria', value: item.categoria_nome },
                  { label: 'Esfera', value: item.esfera_nome },
                  { label: 'Estado', value: item.estado_nome },
                  { label: 'Cidade', value: item.municipio_nome },
                ]} />
              </div>
              <button onClick={() => openEdit(item)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => handleDelete(item)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Cargos Panel ───────────────────────────────────────────────────
// Categoria → Esfera (cascata UI) → Estado? → Cidade? → Escolaridade → Orgao (filtrado) → Nome

function CargosPanel() {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [escolaridadeId, setEscolaridadeId] = useState('')
  const [orgaoId, setOrgaoId] = useState('')
  // Cascata UI (para filtrar orgãos)
  const [esferaId, setEsferaId] = useState('')
  const [estadoId, setEstadoId] = useState('')
  const [municipioId, setMunicipioId] = useState('')
  const [error, setError] = useState('')

  const { data: categoriasData } = useCategorias()
  const { data: esferasData } = useEsferas()
  const { data: estadosData } = useEstados()
  const { data: cidadesData } = useMunicipiosByEstado(estadoId || undefined)
  const { data: escolaridadesData } = useEscolaridades()
  const { data: orgaosData } = useOrgaos()
  const { data, isLoading } = useCargos()
  const createMut = useCreateCargo()
  const updateMut = useUpdateCargo()
  const deleteMut = useDeleteCargo()

  const allCategorias = (categoriasData?.categorias ?? []) as { id: string; nome: string; tipo: string }[]
  const categoriaOpts = idOptions(allCategorias)
  const categoriaGrps = categoriaGroups(allCategorias)
  const esferaOpts = idOptions(esferasData?.items ?? [])
  const estadoOpts = idOptions(estadosData?.items ?? [])
  const cidadeOpts = idOptions(cidadesData ?? [])
  const escolaridadeOpts = idOptions(escolaridadesData?.items ?? [])

  const esferaNome = esferasData?.items.find((e) => e.id === esferaId)?.nome ?? ''
  const showEstado = esferaNome === 'Estadual' || esferaNome === 'Municipal'
  const showCidade = esferaNome === 'Municipal' && !!estadoId

  // Filtra órgãos pela cascata selecionada
  const orgaosFiltrados = (orgaosData?.items ?? []).filter((o) => {
    if (categoriaId && o.categoria_id !== categoriaId) return false
    if (estadoId && o.estado_id && o.estado_id !== estadoId) return false
    if (municipioId && o.municipio_id && o.municipio_id !== municipioId) return false
    return true
  })
  const orgaoOpts = idOptions(orgaosFiltrados)

  function handleEsferaChange(value: string) {
    setEsferaId(value); setOrgaoId('')
    const nome = esferasData?.items.find((e) => e.id === value)?.nome ?? ''
    if (nome !== 'Estadual' && nome !== 'Municipal') { setEstadoId(''); setMunicipioId('') }
    if (nome !== 'Municipal') { setMunicipioId('') }
  }

  function handleEstadoChange(value: string) {
    setEstadoId(value); setMunicipioId(''); setOrgaoId('')
  }

  function openCreate() {
    setEditingId(null); setNome(''); setCategoriaId(''); setEsferaId(''); setEstadoId(''); setMunicipioId(''); setEscolaridadeId(''); setOrgaoId(''); setError(''); setShowForm(true)
  }

  function openEdit(item: Cargo) {
    setEditingId(item.id); setNome(item.nome); setCategoriaId(item.categoria_id ?? ''); setEscolaridadeId(item.escolaridade_id ?? ''); setOrgaoId(item.orgao_id ?? '')
    setEsferaId(''); setEstadoId(''); setMunicipioId(''); setError(''); setShowForm(true)
  }

  function closeForm() { setShowForm(false); setEditingId(null); setError('') }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) { setError('Nome e obrigatorio'); return }
    setError('')
    const payload = {
      nome: nome.trim(),
      categoria_id: categoriaId || null,
      escolaridade_id: escolaridadeId || null,
      orgao_id: orgaoId || null,
    }
    try {
      if (editingId) { await updateMut.mutateAsync({ id: editingId, ...payload }) }
      else { await createMut.mutateAsync(payload) }
      closeForm()
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro ao salvar') }
  }

  function handleDelete(item: Cargo) {
    if (confirm(`Excluir cargo "${item.nome}"?`)) deleteMut.mutate(item.id)
  }

  const isSaving = createMut.isPending || updateMut.isPending

  return (
    <div className="space-y-4">
      <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Novo Cargo</Button>

      {showForm && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">{editingId ? 'Editar Cargo' : 'Novo Cargo'}</h3>
            <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select label="Categoria" placeholder="Selecione a categoria" options={[]} groups={categoriaGrps} value={categoriaId} onChange={(e) => { setCategoriaId(e.target.value); setOrgaoId('') }} />
              <Select label="Esfera" placeholder="Selecione a esfera (filtro)" options={esferaOpts} value={esferaId} onChange={(e) => handleEsferaChange(e.target.value)} />
              {showEstado && (
                <Select label="Estado" placeholder="Selecione o estado" options={estadoOpts} value={estadoId} onChange={(e) => handleEstadoChange(e.target.value)} />
              )}
              {showCidade && (
                <Select label="Cidade" placeholder="Selecione a cidade" options={cidadeOpts} value={municipioId} onChange={(e) => { setMunicipioId(e.target.value); setOrgaoId('') }} />
              )}
              <Select label="Escolaridade" placeholder="Selecione" options={escolaridadeOpts} value={escolaridadeId} onChange={(e) => setEscolaridadeId(e.target.value)} />
              <Select label="Orgao" placeholder={orgaoOpts.length ? 'Selecione o orgao' : 'Nenhum orgao encontrado'} options={orgaoOpts} value={orgaoId} onChange={(e) => setOrgaoId(e.target.value)} />
              <Input label="Nome" placeholder="Nome do cargo" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isSaving} size="sm">{isSaving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar'}</Button>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          </form>
        </div>
      )}

      {isLoading ? <Loading /> : !data?.items.length ? (
        <EmptyState icon={<SlidersHorizontal className="h-12 w-12" />} title="Nenhum cargo encontrado" />
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">{data.total} cargos</p>
          {data.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
              <div className="flex-1">
                <span className="font-medium text-gray-900">{item.nome}</span>
                <ExtraFields fields={[
                  { label: 'Categoria', value: item.categoria_nome },
                  { label: 'Escolaridade', value: item.escolaridade_nome },
                  { label: 'Orgao', value: item.orgao_nome },
                ]} />
              </div>
              <button onClick={() => openEdit(item)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => handleDelete(item)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Disciplinas Panel ──────────────────────────────────────────────
// Categoria (flags!) → Esfera → Estado? → Cidade? → Orgao? → Cargo? → Nome

function DisciplinasPanel() {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [esferaId, setEsferaId] = useState('')
  const [estadoId, setEstadoId] = useState('')
  const [municipioId, setMunicipioId] = useState('')
  const [orgaoId, setOrgaoId] = useState('')
  const [cargoId, setCargoId] = useState('')
  const [error, setError] = useState('')

  const { data: categoriasData } = useCategorias()
  const { data: esferasData } = useEsferas()
  const { data: estadosData } = useEstados()
  const { data: cidadesData } = useMunicipiosByEstado(estadoId || undefined)
  const { data: orgaosData } = useOrgaos()
  const { data: cargosData } = useCargos()
  const { data, isLoading } = useDisciplinas()
  const createMut = useCreateDisciplina()
  const updateMut = useUpdateDisciplina()
  const deleteMut = useDeleteDisciplina()

  const categorias = (categoriasData?.categorias ?? []) as { id: string; nome: string; tipo: string; [k: string]: any }[]
  const categoriaOpts = idOptions(categorias)
  const categoriaGrps = categoriaGroups(categorias)
  const esferaOpts = idOptions(esferasData?.items ?? [])
  const estadoOpts = idOptions(estadosData?.items ?? [])
  const cidadeOpts = idOptions(cidadesData ?? [])

  const selectedCategoria = categorias.find((c) => c.id === categoriaId)
  const showEstado = selectedCategoria?.filtro_estado === true
  const showCidade = selectedCategoria?.filtro_cidade === true
  const showOrgao = selectedCategoria?.filtro_orgao === true
  const showCargo = selectedCategoria?.filtro_cargo === true

  // Filtra órgãos pela cascata
  const orgaosFiltrados = (orgaosData?.items ?? []).filter((o) => {
    if (categoriaId && o.categoria_id !== categoriaId) return false
    if (estadoId && o.estado_id && o.estado_id !== estadoId) return false
    if (municipioId && o.municipio_id && o.municipio_id !== municipioId) return false
    return true
  })
  const orgaoOpts = idOptions(orgaosFiltrados)

  // Filtra cargos pelo orgão selecionado
  const cargosFiltrados = (cargosData?.items ?? []).filter((c) => {
    if (orgaoId && c.orgao_id !== orgaoId) return false
    return true
  })
  const cargoOpts = idOptions(cargosFiltrados)

  function handleEstadoChange(value: string) {
    setEstadoId(value); setMunicipioId(''); setOrgaoId(''); setCargoId('')
  }

  function openCreate() {
    setEditingId(null); setNome(''); setCategoriaId(''); setEsferaId(''); setEstadoId(''); setMunicipioId(''); setOrgaoId(''); setCargoId(''); setError(''); setShowForm(true)
  }

  function openEdit(item: Disciplina) {
    setEditingId(item.id); setNome(item.nome); setCategoriaId(item.categoria_id ?? ''); setEsferaId(item.esfera_id ?? '')
    setEstadoId(item.estado_id ?? ''); setMunicipioId(item.municipio_id ?? ''); setOrgaoId(item.orgao_id ?? ''); setCargoId(item.cargo_id ?? ''); setError(''); setShowForm(true)
  }

  function closeForm() { setShowForm(false); setEditingId(null); setError('') }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) { setError('Nome e obrigatorio'); return }
    setError('')
    const payload = {
      nome: nome.trim(),
      categoria_id: categoriaId || null,
      esfera_id: esferaId || null,
      estado_id: showEstado ? (estadoId || null) : null,
      municipio_id: showCidade ? (municipioId || null) : null,
      orgao_id: showOrgao ? (orgaoId || null) : null,
      cargo_id: showCargo ? (cargoId || null) : null,
    }
    try {
      if (editingId) { await updateMut.mutateAsync({ id: editingId, ...payload }) }
      else { await createMut.mutateAsync(payload) }
      closeForm()
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro ao salvar') }
  }

  function handleDelete(item: Disciplina) {
    if (confirm(`Excluir disciplina "${item.nome}"?`)) deleteMut.mutate(item.id)
  }

  const isSaving = createMut.isPending || updateMut.isPending

  return (
    <div className="space-y-4">
      <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Nova Disciplina</Button>

      {showForm && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">{editingId ? 'Editar Disciplina' : 'Nova Disciplina'}</h3>
            <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select label="Categoria" placeholder="Selecione a categoria" options={[]} groups={categoriaGrps} value={categoriaId} onChange={(e) => { setCategoriaId(e.target.value); setOrgaoId(''); setCargoId('') }} />
              <Select label="Esfera" placeholder="Selecione a esfera" options={esferaOpts} value={esferaId} onChange={(e) => setEsferaId(e.target.value)} />
              {showEstado && (
                <Select label="Estado" placeholder="Selecione o estado" options={estadoOpts} value={estadoId} onChange={(e) => handleEstadoChange(e.target.value)} />
              )}
              {showCidade && estadoId && (
                <Select label="Cidade" placeholder="Selecione a cidade" options={cidadeOpts} value={municipioId} onChange={(e) => { setMunicipioId(e.target.value); setOrgaoId(''); setCargoId('') }} />
              )}
              {showOrgao && (
                <Select label="Orgao" placeholder={orgaoOpts.length ? 'Selecione o orgao' : 'Nenhum orgao encontrado'} options={orgaoOpts} value={orgaoId} onChange={(e) => { setOrgaoId(e.target.value); setCargoId('') }} />
              )}
              {showCargo && (
                <Select label="Cargo" placeholder={cargoOpts.length ? 'Selecione o cargo' : 'Nenhum cargo encontrado'} options={cargoOpts} value={cargoId} onChange={(e) => setCargoId(e.target.value)} />
              )}
              <Input label="Nome" placeholder="Nome da disciplina" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isSaving} size="sm">{isSaving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar'}</Button>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          </form>
        </div>
      )}

      {isLoading ? <Loading /> : !data?.items.length ? (
        <EmptyState icon={<SlidersHorizontal className="h-12 w-12" />} title="Nenhuma disciplina encontrada" />
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">{data.total} disciplinas</p>
          {data.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
              <div className="flex-1">
                <span className="font-medium text-gray-900">{item.nome}</span>
                <ExtraFields fields={[
                  { label: 'Categoria', value: item.categoria_nome },
                  { label: 'Esfera', value: item.esfera_nome },
                  { label: 'Estado', value: item.estado_nome },
                  { label: 'Cidade', value: item.municipio_nome },
                  { label: 'Orgao', value: item.orgao_nome },
                  { label: 'Cargo', value: item.cargo_nome },
                ]} />
              </div>
              <button onClick={() => openEdit(item)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => handleDelete(item)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
