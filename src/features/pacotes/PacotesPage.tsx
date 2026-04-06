import { useState, useRef, useEffect, type FormEvent } from 'react'
import { Package, Plus, Pencil, Trash2, X, BookOpen, Tags, Search, GraduationCap } from 'lucide-react'
import {
  usePacotes, useCreatePacote, useUpdatePacote, useDeletePacote,
  useAllCursos, useAddCursoToPacote, useRemoveCursoFromPacote,
  useAddCategoriaToPacote, useRemoveCategoriaFromPacote,
} from './hooks'
import { useCategorias } from '../categorias/hooks'
import { useCategoria as useCategoriaFiltros, useEstados, useMunicipios, useOrgaos, useCargos, useDisciplinas } from '@/features/cursos/filtros-hooks'
import type { PacoteWithRelations } from './api'
import { uploadFile } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { FileUpload } from '@/components/ui/file-upload'
import { EmptyState } from '@/components/ui/empty-state'

export function PacotesPage() {
  const { data: pacotes, isLoading } = usePacotes()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  function openNew() { setEditingId(null); setModalOpen(true) }
  function openEdit(id: string) { setEditingId(id); setModalOpen(true) }
  function closeModal() { setModalOpen(false); setEditingId(null) }

  const filtered = (pacotes ?? []).filter((p) =>
    p.nome.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pacotes</h1>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Pacote
        </Button>
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editingId ? 'Editar Pacote' : 'Novo Pacote'} maxWidth="max-w-lg">
        <PacoteForm editingId={editingId} pacotes={pacotes ?? []} onClose={closeModal} />
      </Modal>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : !pacotes?.length ? (
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title="Nenhum pacote encontrado"
          description="Crie pacotes para agrupar cursos."
          action={<Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Novo Pacote</Button>}
        />
      ) : (
        <>
          {/* Busca de pacotes */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar pacote..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">Nenhum pacote encontrado para "{search}".</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((pacote) => (
                <PacoteCard key={pacote.id} pacote={pacote} onEdit={() => openEdit(pacote.id)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Form ────────────────────────────────────────────────────────────────────

function PacoteForm({ editingId, pacotes, onClose }: { editingId: string | null; pacotes: PacoteWithRelations[]; onClose: () => void }) {
  const existing = pacotes.find((p) => p.id === editingId)
  const [nome, setNome] = useState(existing?.nome ?? '')
  const [descricao, setDescricao] = useState(existing?.descricao ?? '')
  const [preco, setPreco] = useState(existing?.preco ? String(existing.preco) : '')
  const [imagem, setImagem] = useState<string | null>(existing?.imagem ?? null)
  const [selectedCategorias, setSelectedCategorias] = useState<string[]>(
    () => existing?.pacote_categorias.map((pc) => pc.categoria_id) ?? []
  )
  const [estadoId, setEstadoId] = useState('')
  const [estadoNome, setEstadoNome] = useState(existing?.estado ?? '')
  const [municipioId, setMunicipioId] = useState('')
  const [cidadeNome, setCidadeNome] = useState(existing?.cidade ?? '')
  const [orgaoNome, setOrgaoNome] = useState(existing?.orgao ?? '')
  const [cargoId, setCargoId] = useState('')
  const [cargoNome, setCargoNome] = useState(existing?.cargo ?? '')
  const [disciplinaNome, setDisciplinaNome] = useState(existing?.disciplina ?? '')
  const [error, setError] = useState('')

  const { data: categoriasData } = useCategorias('pacote')
  const activeCategoriaId = selectedCategorias[0] || undefined
  const { data: categoriaFiltros } = useCategoriaFiltros(activeCategoriaId)
  const showEstado = categoriaFiltros?.filtro_estado ?? false
  const showCidade = categoriaFiltros?.filtro_cidade ?? false
  const showOrgao = categoriaFiltros?.filtro_orgao ?? false
  const showCargo = categoriaFiltros?.filtro_cargo ?? false
  const showDisciplina = categoriaFiltros?.filtro_disciplina ?? false

  const { data: estados } = useEstados(showEstado)
  const { data: municipios } = useMunicipios(estadoId || undefined, showCidade && !!estadoId)
  const { data: orgaos } = useOrgaos({ estadoId: estadoId || undefined, municipioId: municipioId || undefined }, showOrgao)
  const { data: cargos } = useCargos({}, showCargo)
  const { data: disciplinas } = useDisciplinas({ cargoId: cargoId || undefined }, showDisciplina)

  const createMutation = useCreatePacote()
  const updateMutation = useUpdatePacote()
  const addCategoria = useAddCategoriaToPacote()
  const removeCategoria = useRemoveCategoriaFromPacote()
  const isSaving = createMutation.isPending || updateMutation.isPending

  function handleCategoriaChange(value: string) {
    setSelectedCategorias(value ? [value] : [])
    setEstadoId(''); setEstadoNome(''); setMunicipioId(''); setCidadeNome(''); setOrgaoNome(''); setCargoId(''); setCargoNome(''); setDisciplinaNome('')
  }

  function handleEstadoChange(value: string, nome: string) {
    setEstadoId(value); setEstadoNome(nome); setMunicipioId(''); setCidadeNome(''); setOrgaoNome('')
  }

  async function syncCategorias(pacoteId: string, originalIds: string[]) {
    const toAdd = selectedCategorias.filter((id) => !originalIds.includes(id))
    const toRemove = originalIds.filter((id) => !selectedCategorias.includes(id))
    await Promise.all([
      ...toAdd.map((categoriaId) => addCategoria.mutateAsync({ pacoteId, categoriaId })),
      ...toRemove.map((categoriaId) => removeCategoria.mutateAsync({ pacoteId, categoriaId })),
    ])
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) { setError('Nome é obrigatório'); return }
    try {
      const payload = {
        nome: nome.trim(), descricao: descricao.trim() || null, preco: preco ? parseFloat(preco) : 0, imagem,
        estado: showEstado && estadoNome ? estadoNome : null,
        cidade: showCidade && cidadeNome ? cidadeNome : null,
        orgao: showOrgao && orgaoNome ? orgaoNome : null,
        cargo: showCargo && cargoNome ? cargoNome : null,
        disciplina: showDisciplina && disciplinaNome ? disciplinaNome : null,
      }
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...payload })
        await syncCategorias(editingId, existing?.pacote_categorias.map((pc) => pc.categoria_id) ?? [])
      } else {
        const created = await createMutation.mutateAsync(payload)
        if (selectedCategorias.length > 0) await syncCategorias(created.id, [])
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  const categorias = categoriasData?.categorias ?? []

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FileUpload label="Imagem do Pacote" accept="image/*" type="image" value={imagem} onChange={setImagem} onUpload={(file) => uploadFile('pacotes', file, 'imagens')} />

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Nome do Pacote</label>
        <Input placeholder="Nome do pacote" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={150} required />
        <p className="text-xs text-gray-400">{nome.length}/150 caracteres</p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Descrição</label>
        <textarea placeholder="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
      </div>

      {categorias.length > 0 && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Categoria</label>
          <Select placeholder="Selecione a categoria" options={categorias.map((c) => ({ value: c.id, label: c.nome }))}
            value={selectedCategorias[0] ?? ''} onChange={(e) => handleCategoriaChange(e.target.value)} />
        </div>
      )}

      {showEstado && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Estado</label>
          <Select placeholder="Selecionar estado" options={(estados ?? []).map((e: any) => ({ value: e.id, label: e.nome }))}
            value={estadoId} onChange={(e) => { const s = (estados ?? []).find((es: any) => es.id === e.target.value); handleEstadoChange(e.target.value, s?.nome ?? '') }} />
        </div>
      )}
      {showCidade && estadoId && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Cidade</label>
          <Select placeholder="Selecionar cidade" options={(municipios ?? []).map((m: any) => ({ value: m.id, label: m.nome }))}
            value={municipioId} onChange={(e) => { setMunicipioId(e.target.value); const s = (municipios ?? []).find((m: any) => m.id === e.target.value); setCidadeNome(s?.nome ?? '') }} />
        </div>
      )}
      {showOrgao && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Órgão</label>
          <Select placeholder="Selecionar órgão" options={(orgaos ?? []).map((o: any) => ({ value: o.nome, label: o.nome }))}
            value={orgaoNome} onChange={(e) => setOrgaoNome(e.target.value)} />
        </div>
      )}
      {showCargo && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Cargo</label>
          <Select placeholder="Selecionar cargo" options={(cargos ?? []).map((c: any) => ({ value: c.id, label: c.nome }))}
            value={cargoId} onChange={(e) => { const s = (cargos ?? []).find((c: any) => c.id === e.target.value); setCargoId(e.target.value); setCargoNome(s?.nome ?? ''); setDisciplinaNome('') }} />
        </div>
      )}
      {showDisciplina && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Disciplina</label>
          <Select placeholder="Selecionar disciplina" options={(disciplinas ?? []).map((d: any) => ({ value: d.nome, label: d.nome }))}
            value={disciplinaNome} onChange={(e) => setDisciplinaNome(e.target.value)} />
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Preço (R$)</label>
        <Input placeholder="0.00" type="number" step="0.01" min="0" value={preco} onChange={(e) => setPreco(e.target.value)} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={isSaving}>{isSaving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar Pacote'}</Button>
      </div>
    </form>
  )
}

// ─── Card ────────────────────────────────────────────────────────────────────

function PacoteCard({ pacote, onEdit }: { pacote: PacoteWithRelations; onEdit: () => void }) {
  const [manageCursos, setManageCursos] = useState(false)
  const [manageCategorias, setManageCategorias] = useState(false)
  const deleteMutation = useDeletePacote()

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden flex flex-col">
        {pacote.imagem && (
          <img src={pacote.imagem} alt="" className="h-36 w-full object-cover" />
        )}

        <div className="p-4 flex flex-col flex-1 gap-3">
          {/* Título + ações */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 leading-snug">{pacote.nome}</h3>
            <div className="flex shrink-0 gap-1">
              <button onClick={onEdit} title="Editar" className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <Pencil className="h-4 w-4" />
              </button>
              <button
                title="Excluir"
                onClick={() => { if (confirm(`Excluir pacote "${pacote.nome}"?`)) deleteMutation.mutate(pacote.id) }}
                className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Descrição */}
          {pacote.descricao && (
            <p className="text-sm text-gray-500 line-clamp-2">{pacote.descricao}</p>
          )}

          {/* Categorias */}
          {pacote.pacote_categorias.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {pacote.pacote_categorias.map((pc) => (
                <Badge key={pc.categoria_id} variant="default">{pc.categorias?.nome}</Badge>
              ))}
            </div>
          )}

          {/* Preço */}
          <p className="text-lg font-bold text-gray-900">
            {pacote.preco ? `R$ ${Number(pacote.preco).toFixed(2)}` : 'Grátis'}
          </p>

          {/* Rodapé com botões */}
          <div className="flex gap-2 mt-auto pt-3 border-t border-gray-100">
            <button
              onClick={() => setManageCursos(true)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              <GraduationCap className="h-3.5 w-3.5" />
              {pacote.pacote_cursos.length} {pacote.pacote_cursos.length === 1 ? 'curso' : 'cursos'}
            </button>
            <button
              onClick={() => setManageCategorias(true)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-purple-300 hover:text-purple-600 transition-colors"
            >
              <Tags className="h-3.5 w-3.5" />
              {pacote.pacote_categorias.length} {pacote.pacote_categorias.length === 1 ? 'categoria' : 'categorias'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal Cursos */}
      <Modal open={manageCursos} onClose={() => setManageCursos(false)} title={`Cursos — ${pacote.nome}`} maxWidth="max-w-md">
        <GerenciarCursosModal pacote={pacote} />
      </Modal>

      {/* Modal Categorias */}
      <Modal open={manageCategorias} onClose={() => setManageCategorias(false)} title={`Categorias — ${pacote.nome}`} maxWidth="max-w-md">
        <GerenciarCategoriasModal pacote={pacote} />
      </Modal>
    </>
  )
}

// ─── Modal Cursos ─────────────────────────────────────────────────────────────

function GerenciarCursosModal({ pacote }: { pacote: PacoteWithRelations }) {
  const { data: allCursos } = useAllCursos()
  const addCurso = useAddCursoToPacote()
  const removeCurso = useRemoveCursoFromPacote()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})

  const linkedCursoIds = new Set(pacote.pacote_cursos.map((pc) => pc.curso_id))
  const available = (allCursos ?? []).filter((c) => !linkedCursoIds.has(c.id))
  const filtered = search.length > 0
    ? available.filter((c) => c.nome.toLowerCase().includes(search.toLowerCase())).slice(0, 5)
    : []

  function updateDropdownPos() {
    if (!inputRef.current) return
    const rect = inputRef.current.getBoundingClientRect()
    setDropdownStyle({ position: 'fixed', top: rect.bottom + 4, left: rect.left, width: rect.width, zIndex: 9999 })
  }

  useEffect(() => {
    if (!open) return
    function onScroll() { setOpen(false) }
    window.addEventListener('scroll', onScroll, true)
    return () => window.removeEventListener('scroll', onScroll, true)
  }, [open])

  return (
    <div className="flex flex-col gap-4" style={{ minHeight: 0 }}>
      {/* Lista com scroll próprio */}
      <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-200">
        {pacote.pacote_cursos.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Nenhum curso vinculado.</p>
        ) : (
          pacote.pacote_cursos.map((pc) => (
            <div key={pc.curso_id} className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="text-sm text-gray-700">{pc.cursos?.nome ?? pc.curso_id}</span>
              </div>
              <button
                onClick={() => removeCurso.mutate({ pacoteId: pacote.id, cursoId: pc.curso_id })}
                className="rounded p-1 text-gray-400 hover:text-red-600 hover:bg-red-50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Input de busca */}
      {available.length > 0 && (
        <div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar curso para adicionar..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setOpen(true); updateDropdownPos() }}
              onFocus={() => { setOpen(true); updateDropdownPos() }}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Dropdown flutuante com position:fixed */}
          {open && filtered.length > 0 && (
            <div style={dropdownStyle} className="rounded-lg border border-gray-200 bg-white shadow-xl overflow-hidden">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onMouseDown={() => {
                    setError('')
                    setSearch('')
                    setOpen(false)
                    addCurso.mutate(
                      { pacoteId: pacote.id, cursoId: c.id },
                      { onError: (err) => setError(err instanceof Error ? err.message : 'Erro ao adicionar') },
                    )
                  }}
                  className="w-full px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                >
                  <BookOpen className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  {c.nome}
                </button>
              ))}
            </div>
          )}
          {open && search && filtered.length === 0 && (
            <div style={dropdownStyle} className="rounded-lg border border-gray-200 bg-white shadow-xl px-3 py-3 text-sm text-gray-400">
              Nenhum curso encontrado.
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

// ─── Modal Categorias ─────────────────────────────────────────────────────────

function GerenciarCategoriasModal({ pacote }: { pacote: PacoteWithRelations }) {
  const { data: categoriasData } = useCategorias('pacote')
  const addCategoria = useAddCategoriaToPacote()
  const removeCategoria = useRemoveCategoriaFromPacote()

  const linkedCategoriaIds = new Set(pacote.pacote_categorias.map((pc) => pc.categoria_id))
  const available = (categoriasData?.categorias ?? []).filter((c) => !linkedCategoriaIds.has(c.id))

  return (
    <div className="space-y-4">
      {pacote.pacote_categorias.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Nenhuma categoria vinculada.</p>
      ) : (
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 overflow-hidden">
          {pacote.pacote_categorias.map((pc) => (
            <div key={pc.categoria_id} className="flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Tags className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="text-sm text-gray-700">{pc.categorias?.nome ?? pc.categoria_id}</span>
              </div>
              <button
                onClick={() => removeCategoria.mutate({ pacoteId: pacote.id, categoriaId: pc.categoria_id })}
                className="rounded p-1 text-gray-400 hover:text-red-600 hover:bg-red-50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {available.length > 0 && (
        <Select
          placeholder="Adicionar categoria..."
          options={available.map((c) => ({ value: c.id, label: c.nome }))}
          value=""
          onChange={(e) => {
            if (e.target.value) addCategoria.mutate({ pacoteId: pacote.id, categoriaId: e.target.value })
          }}
        />
      )}
    </div>
  )
}
